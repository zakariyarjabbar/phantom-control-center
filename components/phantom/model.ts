import {
  stations,
  byId,
  links,
  signals,
  archives,
  routeBetween,
  scenarios,
  type Status,
} from "./data";

export type Tool =
  | "signals"
  | "archive"
  | "decrypt"
  | "stream"
  | "scenarios"
  | "portal"
  | "settings"
  | "secrets";
export type Entry = {
  id: number;
  time: number;
  text: string;
  kind: "system" | "signal" | "station" | "archive" | "trace" | "discovery";
  target?: string;
};
export type Prefs = {
  operator: string;
  brightness: number;
  green: number;
  glow: number;
  crt: boolean;
  scanlines: boolean;
  motion: number;
  audio: boolean;
  ambience: number;
  effects: number;
  density: string;
  lightweight: boolean;
  theme: string;
  workspace: string;
};
export const defaultPrefs: Prefs = {
  operator: "OPERATOR_01",
  brightness: 100,
  green: 100,
  glow: 35,
  crt: true,
  scanlines: true,
  motion: 65,
  audio: false,
  ambience: 25,
  effects: 40,
  density: "comfortable",
  lightweight: false,
  theme: "green",
  workspace: "Map exploration",
};
export type Trace = {
  from: string;
  to: string;
  route: string[];
  start: number;
  done: boolean;
};
export type State = {
  time: number;
  elapsed: number;
  horizon: number;
  playing: boolean;
  speed: number;
  selected: string;
  scenario: string;
  scenarioStarted: number;
  scenarioHistory: { id: string; start: number }[];
  discoveries: string[];
  events: Entry[];
  restores: { station: string; time: number; scenario: string; run: number }[];
  terminal: string[];
  trace: Trace | null;
  traceHistory: Trace[];
  scanStart: number | null;
  scanHistory: { time: number; station?: string }[];
  freq: number;
  tuneHistory: { time: number; freq: number }[];
  prefs: Prefs;
  favorites: string[];
  coordinates: string[];
  dismissed: boolean;
  visited: boolean;
  read: number;
};
export const initialState: State = {
  time: 0,
  elapsed: 0,
  horizon: 300,
  playing: true,
  speed: 1,
  selected: "atlas",
  scenario: "free",
  scenarioStarted: 0,
  scenarioHistory: [{ id: "free", start: 0 }],
  discoveries: [],
  events: [
    {
      id: 1,
      time: 0,
      kind: "signal",
      text: "Unidentified carrier detected in sector-7",
      target: "signal:145.8",
    },
    {
      id: 0,
      time: 0,
      kind: "system",
      text: "PHANTOM network initialized · 14 stations registered",
    },
  ],
  restores: [],
  terminal: [
    "PHANTOM OS [Version 4.0.7]",
    "Secure session established. Welcome, operator.",
    "Unknown signal detected in sector-7.",
    "Type help to view commands.",
  ],
  trace: null,
  traceHistory: [],
  scanStart: null,
  scanHistory: [],
  freq: 144.2,
  tuneHistory: [{ time: 0, freq: 144.2 }],
  prefs: defaultPrefs,
  favorites: [],
  coordinates: [],
  dismissed: false,
  visited: false,
  read: -1,
};
export type Action = { type: string; [key: string]: any };
export const clock = (t: number) =>
  new Date((3 * 3600 + 47 * 60 + t) * 1000).toISOString().slice(11, 19);
export const visibleStations = (s: State) =>
  stations.filter(
    (n) => !n.hidden || s.discoveries.includes("station:" + n.id),
  );
export const scenarioAt = (s: State, time = s.time) =>
  [...s.scenarioHistory].reverse().find((x) => x.start <= time) ?? {
    id: "free",
    start: 0,
  };
export function traceAt(s: State, time = s.time): Trace | null {
  const run = scenarioAt(s, time);
  const trace = [...s.traceHistory]
    .reverse()
    .find((x) => x.start <= time && x.start >= run.start);
  return trace
    ? { ...trace, done: time >= trace.start + trace.route.length * 2 }
    : null;
}
export const scanningAt = (s: State, time = s.time) =>
  s.scanHistory.some(
    (x) =>
      time >= x.time &&
      time < x.time + 6 &&
      x.time >= scenarioAt(s, time).start,
  );
export const frequencyAt = (s: State, time = s.time) =>
  [...s.tuneHistory].reverse().find((x) => x.time <= time)?.freq ?? 144.2;
export function statusAt(s: State, id: string, time = s.time): Status {
  const run = scenarioAt(s, time);
  const restored = s.restores.some(
    (r) =>
      r.station === id &&
      r.time <= time &&
      r.scenario === run.id &&
      (r.run ?? 0) === run.start,
  );
  if (restored) return "operational";
  const dt = time - run.start;
  if (
    run.id === "network-blackout" &&
    ((id === "helix" && dt >= 60) || (id === "orion" && dt >= 120))
  )
    return "silent";
  if (run.id === "lost-satellite" && id === "vega") return "silent";
  return byId(id)?.status ?? "silent";
}
export function telemetry(s: State, time = s.time) {
  const list = visibleStations(s),
    online = list.filter(
      (n) => statusAt(s, n.id, time) === "operational",
    ).length;
  const trace = traceAt(s, time);
  const load = Math.round(
    32 +
      Math.sin(time / 17) * 8 +
      (scanningAt(s, time) ? 32 : 0) +
      (trace && !trace.done ? 14 : 0),
  );
  return {
    online,
    total: list.length,
    load,
    quality: Math.round((online / list.length) * 100),
    packets: Math.round(184 + Math.sin(time / 11) * 28 + load * 2),
    latency: Math.round(
      18 + Math.sin(time / 9) * 4 + (list.length - online) * 2,
    ),
    strength: signalStrength(frequencyAt(s, time)),
  };
}
export function signalStrength(f: number) {
  return Math.max(
    5,
    Math.round(98 - Math.min(...signals.map((x) => Math.abs(x.freq - f))) * 58),
  );
}
export function currentSignal(f: number) {
  return signals.find((x) => Math.abs(x.freq - f) < 0.06);
}
function log(
  s: State,
  text: string,
  kind: Entry["kind"] = "system",
  target?: string,
): State {
  return {
    ...s,
    events: [
      { id: (s.events[0]?.id ?? 0) + 1, time: s.time, text, kind, target },
      ...s.events,
    ].slice(0, 180),
    terminal: [...s.terminal, "[" + clock(s.time) + "] " + text].slice(-150),
  };
}
function unlock(s: State, key: string) {
  return s.discoveries.includes(key)
    ? s
    : { ...s, discoveries: [...s.discoveries, key] };
}
const liveActions = new Set([
  "scan",
  "trace",
  "tune",
  "solve",
  "file",
  "restore",
  "scenario",
]);
export function reducer(s: State, a: Action): State {
  // Timeline replay is observational. A new world-changing action returns to the live edge.
  if (liveActions.has(a.type) && s.time < s.elapsed)
    s = {
      ...s,
      time: s.elapsed,
      freq: frequencyAt(s, s.elapsed),
      trace: traceAt(s, s.elapsed),
    };
  switch (a.type) {
    case "hydrate": {
      const saved = a.state;
      return {
        ...initialState,
        ...saved,
        elapsed: saved.elapsed ?? saved.time,
        prefs: { ...defaultPrefs, ...saved.prefs, audio: false },
        scenarioHistory: saved.scenarioHistory ?? [
          { id: saved.scenario, start: saved.scenarioStarted },
        ],
        traceHistory: saved.traceHistory ?? (saved.trace ? [saved.trace] : []),
        scanHistory:
          saved.scanHistory ??
          (saved.scanStart === null ? [] : [{ time: saved.scanStart }]),
        tuneHistory: saved.tuneHistory ?? [{ time: 0, freq: saved.freq }],
      };
    }
    case "tick": {
      if (!s.playing) return s;
      const time = s.time + s.speed;
      let n: State = {
        ...s,
        time,
        elapsed: Math.max(s.elapsed, time),
        horizon: Math.max(s.horizon, Math.ceil(time / 300) * 300),
        trace: traceAt(s, time),
        freq: frequencyAt(s, time),
      };
      const previous = Math.max(s.time, s.elapsed);
      if (time <= s.elapsed) return n;
      for (const scan of s.scanHistory)
        if (previous < scan.time + 6 && time >= scan.time + 6) {
          n = log(
            unlock(n, "scan"),
            scan.station
              ? byId(scan.station).name +
                  " scan complete · " +
                  statusAt(n, scan.station) +
                  ". Sector-7 carrier: 145.8 MHz."
              : "Sector-7 scan complete. Carrier isolated at 145.8 MHz.",
            "signal",
            "signal:145.8",
          );
        }
      if (s.trace) {
        for (let hop = 1; hop < s.trace.route.length; hop++) {
          const at = s.trace.start + hop * 2;
          if (previous < at && time >= at)
            n = log(
              n,
              "Hop " +
                hop +
                " · " +
                byId(s.trace.route[hop]).name +
                " · " +
                (18 + hop * 11) +
                " ms · " +
                statusAt(s, s.trace.route[hop], at),
              "trace",
              "station:" + s.trace.route[hop],
            );
        }
        const end = s.trace.start + s.trace.route.length * 2;
        if (previous < end && time >= end)
          n = log(
            unlock(n, "trace:" + s.trace.from + ":" + s.trace.to),
            "Trace complete: " +
              s.trace.route.map((x) => byId(x).name).join(" → "),
            "trace",
            "trace",
          );
      }
      for (const run of s.scenarioHistory)
        if (run.id === "network-blackout") {
          for (const [offset, id] of [
            [60, "helix"],
            [120, "orion"],
          ] as const) {
            const at = run.start + offset;
            if (
              previous < at &&
              time >= at &&
              scenarioAt(s, at).start === run.start &&
              statusAt(s, id, at) === "silent"
            )
              n = log(
                n,
                byId(id).name + " carrier lost. Recovery protocol required.",
                "station",
                "station:" + id,
              );
          }
        }
      return n;
    }
    case "select":
    case "inspect": {
      if (!visibleStations(s).some((x) => x.id === a.id))
        return log(s, "Station unavailable. Discover it before inspection.");
      const next = unlock({ ...s, selected: a.id }, "inspect:" + a.id);
      return a.type === "select"
        ? next
        : log(
            next,
            byId(a.id).name +
              " · " +
              byId(a.id).location +
              " · " +
              statusAt(s, a.id),
            "station",
            "station:" + a.id,
          );
    }
    case "scan": {
      const station = visibleStations(s).some((x) => x.id === a.station)
        ? a.station
        : undefined;
      if (scanningAt(s)) return s;
      return log(
        {
          ...s,
          scanStart: s.time,
          scanHistory: [...s.scanHistory, { time: s.time, station }].slice(
            -100,
          ),
          playing: true,
        },
        station
          ? "Scanning " +
              byId(station).name +
              " · listening for carrier changes…"
          : "Scanning sector-7 · listening across the Atlantic array…",
        "signal",
        station ? "station:" + station : "signal:145.8",
      );
    }
    case "trace": {
      const v = visibleStations(s).map((n) => n.id);
      if (!v.includes(a.from) || !v.includes(a.to) || a.from === a.to)
        return log(s, "Choose two different, discovered stations.");
      const route = routeBetween(a.from, a.to, v);
      if (!route.length) return log(s, "No route connects these stations.");
      const trace = {
        from: a.from,
        to: a.to,
        route,
        start: s.time,
        done: false,
      };
      return log(
        {
          ...s,
          selected: a.from,
          playing: true,
          trace,
          traceHistory: [...s.traceHistory, trace].slice(-100),
        },
        "Tracing " +
          a.from.toUpperCase() +
          " → " +
          a.to.toUpperCase() +
          " · " +
          (route.length - 1) +
          " hops",
        "trace",
        "trace",
      );
    }
    case "tune": {
      const f = Math.round(Number(a.freq) * 10) / 10;
      if (!Number.isFinite(f) || f < 80 || f > 500)
        return log(s, "Frequency must be between 80.0 and 500.0 MHz.");
      let n = {
        ...s,
        freq: f,
        tuneHistory: [...s.tuneHistory, { time: s.time, freq: f }].slice(-500),
      };
      const signal = currentSignal(f);
      if (signal && !s.discoveries.includes("signal:" + f)) {
        n = log(
          unlock(n, "signal:" + f),
          "Carrier acquired: " + signal.name + " · " + f.toFixed(1) + " MHz",
          "signal",
          "signal:" + f,
        );
        if (f === 108) n = unlock(unlock(n, "station:null"), "secret:null");
      }
      return n;
    }
    case "solve": {
      const signal = signals.find((x) => x.puzzle === a.id);
      if (
        !signal ||
        !s.discoveries.includes("signal:" + signal.freq) ||
        s.discoveries.includes("puzzle:" + a.id)
      )
        return s;
      let n = log(
        unlock(s, "puzzle:" + a.id),
        "Decryption complete · " + a.id + " key recovered",
        "discovery",
        "archive",
      );
      if (a.id === "wave")
        n = {
          ...log(
            unlock(n, "station:ghost"),
            "Unlisted station revealed: GHOST · 70.12° N, 35.80° W",
            "discovery",
            "station:ghost",
          ),
          selected: "ghost",
        };
      return n;
    }
    case "file": {
      const file = archives.find((x) => x.id === a.id);
      if (!file || (file.requires && !s.discoveries.includes(file.requires)))
        return s;
      let n = unlock(s, "file:" + file.id);
      if (file.unlock) n = unlock(n, file.unlock);
      if (!s.discoveries.includes("file:" + file.id))
        n = log(
          n,
          "Archive accessed · " + file.name,
          "archive",
          "file:" + file.id,
        );
      return n;
    }
    case "restore": {
      if (!visibleStations(s).some((x) => x.id === a.id))
        return log(s, "Station unavailable.");
      let need = "";
      if (
        a.id === "vega" &&
        (!s.discoveries.includes("puzzle:fragments") ||
          !s.discoveries.includes("trace:atlas:vega"))
      )
        need = "Decode the ARGOS fragments and trace ATLAS → VEGA first.";
      else if (
        ["helix", "orion"].includes(a.id) &&
        !s.discoveries.includes("puzzle:restore")
      )
        need = "Repair the HELIX diagnostic at 462.3 MHz first.";
      else if (
        a.id === "helix" &&
        !s.discoveries.includes("trace:cipher:helix")
      )
        need = "Trace CIPHER → HELIX before restarting the carrier.";
      else if (
        a.id === "orion" &&
        !s.restores.some(
          (r) =>
            r.station === "helix" &&
            r.scenario === s.scenario &&
            r.run === s.scenarioStarted &&
            r.time <= s.time,
        )
      )
        need = "Restore HELIX before bringing ORION online.";
      if (need) return log(s, need, "station", "station:" + a.id);
      return log(
        unlock(
          {
            ...s,
            restores: [
              ...s.restores,
              {
                station: a.id,
                time: s.time,
                scenario: s.scenario,
                run: s.scenarioStarted,
              },
            ].slice(-200),
          },
          "restore:" + a.id,
        ),
        byId(a.id).name + " restored. Carrier stable.",
        "discovery",
        "station:" + a.id,
      );
    }
    case "scenario": {
      if (!scenarios.some((x) => x.id === a.id) || a.id === s.scenario)
        return s;
      return log(
        {
          ...s,
          scenario: a.id,
          scenarioStarted: s.time,
          scenarioHistory: [
            ...s.scenarioHistory,
            { id: a.id, start: s.time },
          ].slice(-100),
          trace: null,
          scanStart: null,
          playing: true,
        },
        "Scenario active · " + scenarios.find((x) => x.id === a.id)!.name,
        "system",
        "scenarios",
      );
    }
    case "seek": {
      const time = Math.max(0, Math.min(s.elapsed, Math.round(a.time)));
      return {
        ...s,
        time,
        freq: frequencyAt(s, time),
        trace: traceAt(s, time),
        playing: false,
      };
    }
    case "play":
      return { ...s, playing: a.value ?? !s.playing };
    case "live":
      return {
        ...s,
        time: s.elapsed,
        freq: frequencyAt(s, s.elapsed),
        trace: traceAt(s, s.elapsed),
        playing: true,
      };
    case "speed":
      return [0.5, 1, 2, 4].includes(a.speed) ? { ...s, speed: a.speed } : s;
    case "pref":
      return { ...s, prefs: { ...s.prefs, [a.key]: a.value } };
    case "favorites":
    case "coordinates":
      return {
        ...s,
        [a.type]: s[a.type].includes(a.id)
          ? s[a.type].filter((x: string) => x !== a.id)
          : [...s[a.type], a.id],
      };
    case "dismiss":
      return { ...s, dismissed: true };
    case "visited":
      return { ...s, visited: true };
    case "read":
      return { ...s, read: s.events[0]?.id ?? 0 };
    case "secret":
      return s.discoveries.includes("secret:" + a.id)
        ? s
        : log(
            unlock(s, "secret:" + a.id),
            "Secret recovered · " + a.id,
            "discovery",
            "secrets",
          );
    case "output":
      return { ...s, terminal: [...s.terminal, a.text].slice(-150) };
    case "clear":
      return { ...s, terminal: [] };
    case "reset-prefs":
      return { ...s, prefs: defaultPrefs };
    case "reset-progress":
      return {
        ...initialState,
        prefs: s.prefs,
        favorites: s.favorites,
        coordinates: s.coordinates,
        visited: true,
      };
    default:
      return s;
  }
}
export function packetsAt(s: State, time = s.time) {
  const visible = visibleStations(s).map((x) => x.id);
  return Array.from({ length: 40 }, (_, i) => {
    const t = Math.floor(time / 2) * 2 - i * 2;
    if (t < 0) return null;
    const index = Math.floor(t / 2),
      edge = links[index % links.length];
    if (!edge.every((id) => visible.includes(id))) return null;
    const from = index % 2 ? edge[0] : edge[1],
      to = index % 2 ? edge[1] : edge[0];
    const kind = ["telemetry", "relay", "diagnostic", "archive"][index % 4];
    return {
      id: "PKT-" + (4096 + index).toString(16).toUpperCase(),
      time: t,
      from,
      to,
      kind,
      bytes: 128 + ((index * 37) % 896),
      payload:
        kind === "diagnostic"
          ? "CARRIER " + statusAt(s, from, t).toUpperCase()
          : kind === "archive"
            ? "MANIFEST " +
              ((index * 2654435761) >>> 0).toString(16).toUpperCase()
            : kind === "relay"
              ? "FORWARD · TTL 64"
              : "LOAD " +
                telemetry(s, t).load +
                "% · Q " +
                telemetry(s, t).quality +
                "%",
      route: routeBetween(from, to, visible),
      interrupted: [from, to].some((x) => statusAt(s, x, t) === "silent"),
    };
  })
    .filter((x) => x !== null)
    .slice(0, 25);
}
