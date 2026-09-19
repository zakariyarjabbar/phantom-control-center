"use client";
import { useState, useEffect, useMemo, useRef } from "react";
import {
  Globe2,
  Network,
  Map as MapIcon,
  Plus,
  Minus,
  LocateFixed,
  RotateCcw,
  ScanLine,
  SlidersHorizontal,
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NativeSelect } from "@/components/ui/native-select";
import { stations, links, byId, neighbors } from "./data";
import {
  type State,
  type Action,
  visibleStations,
  statusAt,
  clock,
} from "./model";
const flat = (lon: number, lat: number): [number, number] => [
  ((lon + 180) / 360) * 1000,
  ((85 - lat) / 150) * 490 + 14,
];
const rad = Math.PI / 180;
function globe(
  lon: number,
  lat: number,
  rot: number,
): [number, number, number] {
  const a = (lon + rot) * rad,
    b = lat * rad;
  return [
    500 + 235 * Math.cos(b) * Math.sin(a),
    265 - 235 * Math.sin(b),
    Math.cos(b) * Math.cos(a),
  ];
}
export default function TacticalMap({
  state: s,
  dispatch,
  mode,
  setMode,
  highlight,
  focusToken,
}: {
  state: State;
  dispatch: (a: Action) => void;
  mode: string;
  setMode: (m: string) => void;
  highlight: string[];
  focusToken: number;
}) {
  const [world, setWorld] = useState<number[][][]>([]),
    [view, setView] = useState({ x: 0, y: 0, z: 1 }),
    [filter, setFilter] = useState("all"),
    [cluster, setCluster] = useState("all"),
    [isolate, setIsolate] = useState(false),
    [filters, setFilters] = useState(false),
    [positions, setPositions] = useState<Record<string, [number, number]>>({}),
    [rot, setRot] = useState(0),
    [rotate, setRotate] = useState(true),
    [assetError, setAssetError] = useState(false);
  const svg = useRef<SVGSVGElement>(null),
    drag = useRef<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      node?: string;
      moved: boolean;
    } | null>(null);
  useEffect(() => {
    fetch("/data/world.json")
      .then((r) => {
        if (!r.ok) throw Error();
        return r.json();
      })
      .then((v) => setWorld(v as number[][][]))
      .catch(() => setAssetError(true));
  }, []);
  const land = useMemo(
    () =>
      world
        .map(
          (p) =>
            p
              .map(
                ([lon, lat], i) => (i ? "L" : "M") + flat(lon, lat).join(","),
              )
              .join("") + "Z",
        )
        .join(""),
    [world],
  );
  const rotation =
    rot +
    (rotate && s.prefs.motion > 0 && !s.prefs.lightweight
      ? s.time * 0.6 * (s.prefs.motion / 65)
      : 0);
  const globeLand = useMemo(
    () =>
      world
        .map((poly) => {
          let drawing = false;
          return poly
            .map(([lon, lat]) => {
              const [x, y, z] = globe(lon, lat, rotation);
              if (z < 0) {
                drawing = false;
                return "";
              }
              const v =
                (drawing ? "L" : "M") + x.toFixed(1) + "," + y.toFixed(1);
              drawing = true;
              return v;
            })
            .join("");
        })
        .join(""),
    [world, rotation],
  );
  const visible = visibleStations(s),
    connected = neighbors(s.selected);
  const shown = visible.filter(
    (n) =>
      (filter === "all" || statusAt(s, n.id) === filter) &&
      (cluster === "all" || n.cluster === cluster) &&
      (!isolate || n.id === s.selected || connected.includes(n.id)),
  );
  const pos = (id: string): [number, number, number] => {
    const n = byId(id);
    if (mode === "globe") return globe(n.lon, n.lat, rotation);
    if (mode === "network") {
      const i = stations.findIndex((n) => n.id === id),
        a = i * 2.39996;
      const radius = 95 + Math.floor(i / 4) * 48;
      return [
        ...(positions[id] || [
          500 + Math.cos(a) * radius * 1.55,
          255 + Math.sin(a) * radius,
        ]),
        1,
      ];
    }
    return [...flat(n.lon, n.lat), 1];
  };
  const focus = () => {
    const [x, y] = pos(s.selected);
    setView({ x: 500 - x * 1.6, y: 260 - y * 1.6, z: 1.6 });
  };
  useEffect(() => {
    if (focusToken) focus();
  }, [focusToken]);
  const zoom = (d: number) =>
    setView((v) => {
      const z = Math.max(0.7, Math.min(4, v.z * d));
      return {
        z,
        x: 500 - ((500 - v.x) * z) / v.z,
        y: 260 - ((260 - v.y) * z) / v.z,
      };
    });
  const move = (e: React.PointerEvent) => {
    if (!drag.current || !svg.current) return;
    const box = svg.current.getBoundingClientRect(),
      dx = ((e.clientX - drag.current.x) * 1000) / box.width,
      dy = ((e.clientY - drag.current.y) * 520) / box.height;
    if (Math.abs(dx) + Math.abs(dy) > 4) drag.current.moved = true;
    if (drag.current.node)
      setPositions((p) => ({
        ...p,
        [drag.current!.node!]: [
          drag.current!.vx + dx / view.z,
          drag.current!.vy + dy / view.z,
        ],
      }));
    else if (mode === "globe") setRot(drag.current.vx + dx * 0.4);
    else
      setView((v) => ({
        ...v,
        x: drag.current!.vx + dx,
        y: drag.current!.vy + dy,
      }));
  };
  const route = s.trace?.route || [];
  const scanning =
    s.scanStart !== null &&
    s.time - s.scanStart >= 0 &&
    s.time - s.scanStart < 6;
  return (
    <section
      className={"tactical-map " + (scanning ? "scanning" : "")}
      aria-label="Interactive network map"
    >
      <div className="map-topline">
        <span>
          <span className="live-dot" /> GEOSPATIAL NETWORK
        </span>
        <span className="muted map-meta">
          WGS 84 <span className="divider">/</span> ENCRYPTED UPLINK
        </span>
      </div>
      <div className="map-toolbar">
        <Tabs
          value={mode}
          onValueChange={(m) => {
            setMode(m);
            setView({ x: 0, y: 0, z: 1 });
          }}
        >
          <TabsList className="map-tabs">
            <TabsTrigger value="map">
              <MapIcon size={14} /> Tactical
            </TabsTrigger>
            <TabsTrigger value="globe">
              <Globe2 size={14} /> Globe
            </TabsTrigger>
            <TabsTrigger value="network">
              <Network size={14} /> Constellation
            </TabsTrigger>
          </TabsList>
        </Tabs>
        <button
          className={"icon-button " + (filters ? "active" : "")}
          title="Filter stations"
          aria-label="Filter stations"
          onClick={() => setFilters(!filters)}
        >
          <SlidersHorizontal size={16} />
        </button>
      </div>
      {filters && (
        <div className="map-filters">
          <NativeSelect
            aria-label="Select station"
            value={s.selected}
            onChange={(e) => dispatch({ type: "select", id: e.target.value })}
          >
            {visible.map((n) => (
              <option key={n.id} value={n.id}>
                {n.name}
              </option>
            ))}
          </NativeSelect>
          <NativeSelect
            aria-label="Filter station status"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">All states</option>
            <option value="operational">Operational</option>
            <option value="unstable">Unstable</option>
            <option value="silent">Silent</option>
          </NativeSelect>
          <NativeSelect
            aria-label="Filter cluster"
            value={cluster}
            onChange={(e) => setCluster(e.target.value)}
          >
            {["all", "Atlantic", "Americas", "Pacific", "Southern"].map((c) => (
              <option key={c} value={c}>
                {c === "all" ? "All clusters" : c}
              </option>
            ))}
          </NativeSelect>
          <button
            className={"small-button " + (isolate ? "active" : "")}
            onClick={() => setIsolate(!isolate)}
          >
            Isolate {s.selected.toUpperCase()}
          </button>
        </div>
      )}
      <div className="map-canvas">
        <div className="map-coordinate coord-left">
          90° N<br />
          <br />
          45° N<br />
          <br />
          0°
          <br />
          <br />
          45° S
        </div>
        <svg
          ref={svg}
          viewBox="0 0 1000 520"
          role="group"
          aria-label={`${mode} view. Select a station or drag to pan.`}
          onWheel={(e) => zoom(e.deltaY < 0 ? 1.08 : 0.93)}
          onPointerDown={(e) => {
            if (e.button !== 0) return;
            const [x, y] = mode === "globe" ? [rot, 0] : [view.x, view.y];
            drag.current = {
              x: e.clientX,
              y: e.clientY,
              vx: x,
              vy: y,
              moved: false,
            };
            e.currentTarget.setPointerCapture(e.pointerId);
          }}
          onPointerMove={move}
          onPointerUp={() => {
            setTimeout(() => (drag.current = null), 0);
          }}
          onPointerCancel={() => (drag.current = null)}
        >
          <defs>
            <pattern
              id="map-grid"
              width="83.333"
              height="65"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M83.333 0H0V65"
                fill="none"
                stroke="var(--map-grid)"
                strokeWidth=".6"
              />
            </pattern>
            <pattern
              id="land-dots"
              width="4"
              height="4"
              patternUnits="userSpaceOnUse"
            >
              <circle cx="2" cy="2" r=".7" fill="var(--land-dot)" />
            </pattern>
            <filter id="point-glow">
              <feGaussianBlur stdDeviation="3" />
            </filter>
            <radialGradient id="radar-fill">
              <stop offset="0%" stopColor="var(--green)" stopOpacity=".03" />
              <stop offset="100%" stopColor="var(--green)" stopOpacity=".12" />
            </radialGradient>
            <clipPath id="globe-clip">
              <circle cx="500" cy="265" r="235" />
            </clipPath>
          </defs>
          <rect width="1000" height="520" fill="url(#map-grid)" />
          <g transform={`translate(${view.x} ${view.y}) scale(${view.z})`}>
            {mode === "map" && (
              <>
                <path
                  d={land}
                  fill="var(--land-fill)"
                  stroke="var(--land-stroke)"
                  strokeWidth=".6"
                />
                <path d={land} fill="url(#land-dots)" />
              </>
            )}
            {mode === "globe" && (
              <g clipPath="url(#globe-clip)">
                <circle
                  cx="500"
                  cy="265"
                  r="235"
                  fill="var(--land-fill)"
                  stroke="var(--land-stroke)"
                />
                {[-60, -30, 0, 30, 60].map((lat) => (
                  <ellipse
                    key={lat}
                    cx="500"
                    cy={265 - 235 * Math.sin(lat * rad)}
                    rx={235 * Math.cos(lat * rad)}
                    ry=".5"
                    fill="none"
                    stroke="var(--map-grid)"
                  />
                ))}
                {[0, 30, 60, 90, 120, 150].map((a) => (
                  <ellipse
                    key={a}
                    cx="500"
                    cy="265"
                    rx={Math.abs(235 * Math.cos((a + rotation) * rad))}
                    ry="235"
                    fill="none"
                    stroke="var(--land-stroke)"
                    strokeWidth=".55"
                  />
                ))}
                <path
                  d={globeLand}
                  fill="none"
                  stroke="var(--land-dot)"
                  strokeWidth=".75"
                />
              </g>
            )}
            {mode === "network" &&
              [100, 180, 260].map((r) => (
                <ellipse
                  key={r}
                  cx="500"
                  cy="255"
                  rx={r * 1.4}
                  ry={r}
                  fill="none"
                  stroke="var(--map-grid)"
                  strokeDasharray="2 6"
                />
              ))}
            {links
              .filter((l) => l.every((id) => shown.some((n) => n.id === id)))
              .map(([a, b], i) => {
                const [x1, y1, z1] = pos(a),
                  [x2, y2, z2] = pos(b);
                if (z1 < 0 || z2 < 0) return null;
                const selected = [a, b].includes(s.selected),
                  traced = route.some(
                    (id, j) =>
                      (id === a && route[j + 1] === b) ||
                      (id === b && route[j + 1] === a),
                  ),
                  picked = highlight.includes(a) && highlight.includes(b),
                  failed = [a, b].some((id) => statusAt(s, id) === "silent");
                const progress = ((s.time + i * 5) % 24) / 24;
                const bend =
                  mode === "network"
                    ? 0
                    : Math.min(Math.abs(x1 - x2) * 0.2, 75);
                const cx = (x1 + x2) / 2,
                  cy = (y1 + y2) / 2 - bend,
                  d = `M${x1},${y1} Q${cx},${cy} ${x2},${y2}`;
                const px =
                    (1 - progress) ** 2 * x1 +
                    2 * (1 - progress) * progress * cx +
                    progress ** 2 * x2,
                  py =
                    (1 - progress) ** 2 * y1 +
                    2 * (1 - progress) * progress * cy +
                    progress ** 2 * y2;
                return (
                  <g
                    key={a + b}
                    className={
                      (traced || picked
                        ? "traced "
                        : selected
                          ? "connected "
                          : "") + (failed ? "interrupted" : "")
                    }
                  >
                    <path
                      className="network-link"
                      d={d}
                      strokeWidth={
                        traced || picked ? 1.5 : selected ? 1.05 : 0.65
                      }
                      strokeDasharray={failed ? "3 5" : undefined}
                    />
                    {!failed && !s.prefs.lightweight && s.prefs.motion > 0 && (
                      <circle
                        cx={px}
                        cy={py}
                        r={selected ? 2 : 1.3}
                        fill={selected ? "var(--green)" : "var(--land-dot)"}
                      />
                    )}
                  </g>
                );
              })}
            {shown.map((n) => {
              const [x, y, z] = pos(n.id);
              if (z < 0) return null;
              const selected = s.selected === n.id,
                status = statusAt(s, n.id);
              return (
                <g
                  key={n.id}
                  className={
                    "station-node " + status + (selected ? " selected" : "")
                  }
                  transform={`translate(${x} ${y})`}
                  role="button"
                  aria-label={`${n.name}, ${status}, ${n.location}`}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      dispatch({ type: "select", id: n.id });
                    }
                    if (mode === "network" && e.key.startsWith("Arrow")) {
                      e.preventDefault();
                      setPositions((p) => ({
                        ...p,
                        [n.id]: [
                          x +
                            (e.key === "ArrowRight"
                              ? 10
                              : e.key === "ArrowLeft"
                                ? -10
                                : 0),
                          y +
                            (e.key === "ArrowDown"
                              ? 10
                              : e.key === "ArrowUp"
                                ? -10
                                : 0),
                        ],
                      }));
                    }
                  }}
                  onPointerDown={(e) => {
                    if (mode === "network") {
                      e.stopPropagation();
                      drag.current = {
                        x: e.clientX,
                        y: e.clientY,
                        vx: x,
                        vy: y,
                        node: n.id,
                        moved: false,
                      };
                      svg.current?.setPointerCapture(e.pointerId);
                    }
                  }}
                  onClick={() => {
                    if (!drag.current?.moved)
                      dispatch({ type: "select", id: n.id });
                  }}
                >
                  <circle r="16" fill="transparent" />
                  {selected && (
                    <>
                      <circle
                        r="29"
                        fill="url(#radar-fill)"
                        stroke="var(--green)"
                        strokeOpacity=".15"
                      />
                      <circle
                        r="18"
                        fill="none"
                        stroke="var(--green)"
                        strokeOpacity=".35"
                        strokeDasharray="1 4"
                      />
                      <path
                        className="target-bracket"
                        d="M-23,-13V-23H-13 M13,-23H23V-13 M23,13V23H13 M-13,23H-23V13"
                        fill="none"
                        stroke="var(--green)"
                        strokeWidth="1"
                      />
                    </>
                  )}
                  {status === "operational" && s.prefs.glow > 0 && (
                    <circle
                      r="6"
                      className="node-glow"
                      filter="url(#point-glow)"
                    />
                  )}
                  <circle r={selected ? 4 : 3.2} className="node-core" />
                  <circle r="7" fill="none" className="node-ring" />
                  <text
                    x={selected ? 31 : 12}
                    y={selected ? 4 : -9}
                    className="node-label"
                  >
                    {n.name}
                  </text>
                  {selected && (
                    <text x="31" y="20" className="node-sub">
                      {n.code} /{" "}
                      {status === "silent"
                        ? "NO CARRIER"
                        : status === "unstable"
                          ? "UNSTABLE"
                          : "CONNECTED"}
                    </text>
                  )}
                </g>
              );
            })}
            {scanning && (
              <g className="scan-geometry">
                <circle
                  cx="500"
                  cy="220"
                  r={(s.time - s.scanStart!) * 60 + 30}
                  fill="none"
                  stroke="var(--green)"
                  opacity=".6"
                />
                <circle
                  cx="500"
                  cy="220"
                  r={(s.time - s.scanStart!) * 60 + 15}
                  fill="none"
                  stroke="var(--green)"
                  opacity=".15"
                />
              </g>
            )}
          </g>
          <path
            d="M15 35V15H35 M965 15H985V35 M985 485V505H965 M35 505H15V485"
            fill="none"
            stroke="var(--land-dot)"
            strokeWidth="1"
          />
        </svg>
        {assetError && (
          <p className="map-error">
            Geography could not load. Station controls remain available. Reload
            to retry.
          </p>
        )}
        {!shown.length && (
          <p className="map-error">No stations match these filters.</p>
        )}
        <div className="map-controls">
          <button
            className="icon-button"
            aria-label="Zoom in"
            onClick={() => zoom(1.25)}
          >
            <Plus size={17} />
          </button>
          <button
            className="icon-button"
            aria-label="Zoom out"
            onClick={() => zoom(0.8)}
          >
            <Minus size={17} />
          </button>
          <span />
          <button
            className="icon-button"
            aria-label="Focus selected station"
            title="Focus selected station"
            onClick={focus}
          >
            <LocateFixed size={17} />
          </button>
          <button
            className="icon-button"
            aria-label="Reset map view"
            title="Reset map view"
            onClick={() => {
              setView({ x: 0, y: 0, z: 1 });
              setPositions({});
              setRot(0);
              setFilter("all");
              setCluster("all");
              setIsolate(false);
            }}
          >
            <RotateCcw size={15} />
          </button>
        </div>
        <div className="map-readout">
          <span>SECTOR 07</span>
          <strong>
            {Math.abs(byId(s.selected).lat).toFixed(2)}°{" "}
            {byId(s.selected).lat >= 0 ? "N" : "S"} <span>/</span>{" "}
            {Math.abs(byId(s.selected).lon).toFixed(2)}°{" "}
            {byId(s.selected).lon >= 0 ? "E" : "W"}
          </strong>
          <span>
            ZOOM {view.z.toFixed(2)}× · {shown.length} STATIONS
          </span>
        </div>
        <div className="map-scale">
          <div />
          <span>
            0 <span>2,000 KM</span>
          </span>
        </div>
      </div>
      <div className="map-foot">
        <div className="legend">
          <span>
            <i className="operational" />
            Operational
          </span>
          <span>
            <i className="unstable" />
            Unstable
          </span>
          <span>
            <i className="silent" />
            Silent
          </span>
        </div>
        {mode === "globe" ? (
          <button onClick={() => setRotate(!rotate)} className="text-button">
            {rotate ? "Pause rotation" : "Resume rotation"}
          </button>
        ) : (
          <span className="muted map-help">
            {mode === "network"
              ? "DRAG NODES · ARROW KEYS TO MOVE"
              : "SCROLL TO ZOOM · DRAG TO PAN"}
          </span>
        )}
        <button
          className="small-button"
          onClick={() => dispatch({ type: "scan" })}
        >
          <ScanLine size={14} />
          {scanning ? "Scanning…" : "Scan sector"}
        </button>
      </div>
    </section>
  );
}
