"use client";
import { useState, useEffect, useReducer, useRef, useCallback } from "react";
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  AudioLines,
  Check,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Command,
  Compass,
  FileText,
  FolderArchive,
  Globe2,
  HelpCircle,
  Layers,
  Maximize2,
  Minimize2,
  Minus,
  Network,
  Pause,
  Play,
  Radio,
  RotateCcw,
  ScanLine,
  Search,
  Settings2,
  ShieldCheck,
  Signal,
  SquareTerminal,
  Volume2,
  VolumeX,
  X,
  Target,
  LockKeyhole,
  Satellite,
  BookOpen,
  PanelRightClose,
  PanelRightOpen,
} from "lucide-react";
import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import { Slider } from "@/components/ui/slider";
import { NativeSelect } from "@/components/ui/native-select";
import { Progress } from "@/components/ui/progress";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import TacticalMap from "@/components/phantom/Map";
import { useWebMCP } from "@/components/phantom/useWebMCP";
import Tools from "@/components/phantom/Tools";
import {
  stations,
  byId,
  neighbors,
  archives,
  scenarios,
  signals,
} from "@/components/phantom/data";
import {
  initialState,
  reducer,
  defaultPrefs,
  clock,
  telemetry,
  statusAt,
  visibleStations,
  type Tool,
  type Action,
  type State,
} from "@/components/phantom/model";
const toolsList: { id: Tool; label: string; icon: any; key: string }[] = [
  { id: "signals", label: "Signal lab", icon: Radio, key: "2" },
  { id: "archive", label: "Archive", icon: FolderArchive, key: "3" },
  { id: "decrypt", label: "Decryption", icon: LockKeyhole, key: "4" },
  { id: "stream", label: "Data stream", icon: Activity, key: "5" },
  { id: "scenarios", label: "Scenarios", icon: Layers, key: "6" },
  { id: "portal", label: "Explore the web", icon: Compass, key: "7" },
];
const suggestions = [
  "help",
  "scan sector-7",
  "inspect atlas",
  "trace atlas echo",
  "open archive",
  "tune 145.8",
  "scenario ghost-signal",
];
const STORAGE = "phantom.control.v1";
export default function Home() {
  const [s, dispatch] = useReducer(reducer, initialState),
    [ready, setReady] = useState(false),
    [mode, setMode] = useState("map"),
    [opened, setOpened] = useState<Tool[]>([]),
    [minimized, setMinimized] = useState<Tool[]>([]),
    [front, setFront] = useState<Tool | null>(null),
    [focusToken, setFocusToken] = useState(0),
    [highlight, setHighlight] = useState<string[]>([]),
    [file, setFile] = useState("001"),
    [puzzle, setPuzzle] = useState("wave"),
    [bottom, setBottom] = useState(true),
    [eventFilter, setEventFilter] = useState("all"),
    [feedPaused, setFeedPaused] = useState(false),
    [frozenEvents, setFrozenEvents] = useState(s.events),
    [input, setInput] = useState(""),
    [history, setHistory] = useState<string[]>([]),
    [historyIndex, setHistoryIndex] = useState(-1),
    [boot, setBoot] = useState(false),
    [bootStep, setBootStep] = useState(0),
    [mobileInspector, setMobileInspector] = useState(false),
    [layoutReset, setLayoutReset] = useState(0),
    [completion, setCompletion] = useState("");
  const terminal = useRef<HTMLInputElement>(null),
    terminalScroll = useRef<HTMLDivElement>(null),
    audio = useRef<AudioContext | null>(null),
    ambient = useRef<{ osc: OscillatorNode; gain: GainNode } | null>(null),
    stateRef = useRef(s);
  stateRef.current = s;
  const act = useCallback((a: Action) => {
    if (a.type === "restore") {
      const result = reducer(stateRef.current, a);
      const event = result.events[0];
      if (event?.kind === "discovery") toast.success(event.text);
      else if (event) toast(event.text);
    }
    dispatch(a);
    if (a.type === "inspect") setMobileInspector(true);
  }, []);
  const open = useCallback((tool: Tool) => {
    setOpened((v) => (v.includes(tool) ? v : [...v, tool]));
    setMinimized((v) => v.filter((x) => x !== tool));
    setFront(tool);
  }, []);
  useWebMCP(stateRef, act, open);
  const close = (tool: Tool) => {
    setOpened((v) => v.filter((x) => x !== tool));
    setMinimized((v) => v.filter((x) => x !== tool));
    setFront(null);
  };
  const sound = (freq = 480, duration = 0.07) => {
    const current = stateRef.current;
    if (!current.prefs.audio) return;
    try {
      const ctx = audio.current || (audio.current = new AudioContext());
      void ctx.resume();
      const o = ctx.createOscillator(),
        g = ctx.createGain();
      o.frequency.value = freq;
      o.type = "sine";
      g.gain.setValueAtTime(
        (current.prefs.effects / 100) * 0.07,
        ctx.currentTime,
      );
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      o.connect(g).connect(ctx.destination);
      o.start();
      o.stop(ctx.currentTime + duration);
    } catch {}
  };
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE);
      if (raw) {
        const data = JSON.parse(raw);
        if (
          data.version === 1 &&
          Array.isArray(data.state?.discoveries) &&
          stations.some((n) => n.id === data.state.selected)
        ) {
          dispatch({
            type: "hydrate",
            state: {
              ...initialState,
              ...data.state,
              prefs: { ...defaultPrefs, ...data.state.prefs },
              playing: true,
            },
          });
          const layout = JSON.parse(
            localStorage.getItem("phantom.workspace") || "null",
          );
          if (layout) {
            setOpened(
              (layout.opened || []).filter((x: string) =>
                [...toolsList.map((t) => t.id), "settings", "secrets"].includes(
                  x,
                ),
              ),
            );
            setMinimized(layout.minimized || []);
          }
        }
      } else setBoot(true);
    } catch {
      toast.error("Local save unavailable. This session still works.");
    }
    if (matchMedia("(prefers-reduced-motion: reduce)").matches)
      dispatch({ type: "pref", key: "motion", value: 0 });
    setReady(true);
  }, []);
  useEffect(() => {
    if (!ready) return;
    const timer = setInterval(() => {
      if (!document.hidden) dispatch({ type: "tick" });
    }, 1000);
    return () => clearInterval(timer);
  }, [ready]);
  useEffect(() => {
    if (!ready) return;
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE, JSON.stringify({ version: 1, state: s }));
      } catch {}
    }, 250);
    return () => clearTimeout(timer);
  }, [s, ready]);
  useEffect(() => {
    const save = () => {
      try {
        localStorage.setItem(
          STORAGE,
          JSON.stringify({ version: 1, state: stateRef.current }),
        );
      } catch {}
    };
    window.addEventListener("pagehide", save);
    return () => window.removeEventListener("pagehide", save);
  }, []);
  useEffect(() => {
    if (ready)
      try {
        localStorage.setItem(
          "phantom.workspace",
          JSON.stringify({ opened, minimized }),
        );
      } catch {}
  }, [opened, minimized, ready]);
  useEffect(() => {
    if (!boot) return;
    setBootStep(0);
    const timer = setInterval(() => setBootStep((v) => v + 1), 550),
      end = setTimeout(() => {
        setBoot(false);
        dispatch({ type: "visited" });
      }, 2900);
    return () => {
      clearInterval(timer);
      clearTimeout(end);
    };
  }, [boot]);
  useEffect(() => {
    terminalScroll.current?.scrollTo({
      top: terminalScroll.current.scrollHeight,
      behavior: "instant",
    });
  }, [s.terminal]);
  useEffect(() => {
    if (!s.prefs.audio) {
      ambient.current?.osc.stop();
      ambient.current = null;
      return;
    }
    try {
      const ctx = audio.current || (audio.current = new AudioContext());
      void ctx.resume();
      if (!ambient.current) {
        const osc = ctx.createOscillator(),
          gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.value = 58;
        osc.connect(gain).connect(ctx.destination);
        osc.start();
        ambient.current = { osc, gain };
      }
      ambient.current.gain.gain.setTargetAtTime(
        (s.prefs.ambience / 100) * 0.025,
        ctx.currentTime,
        0.2,
      );
    } catch {}
  }, [s.prefs.audio, s.prefs.ambience]);
  const scenario = scenarios.find((x) => x.id === s.scenario)!,
    stepsDone = scenario.steps.filter(([id]) =>
      s.discoveries.includes(id),
    ).length,
    scenarioComplete =
      scenario.steps.length > 0 && stepsDone === scenario.steps.length;
  useEffect(() => {
    if (!s.discoveries.length) setCompletion("");
  }, [s.discoveries.length]);
  useEffect(() => {
    if (scenarioComplete && completion !== s.scenario) {
      setCompletion(s.scenario);
      toast.success(scenario.name + " complete. Network mystery resolved.", {
        duration: 6000,
      });
      sound(740, 0.35);
    }
  }, [scenarioComplete, s.scenario]);
  const m = telemetry(s),
    station = byId(s.selected),
    status = statusAt(s, s.selected),
    scanning =
      s.scanStart !== null &&
      s.time - s.scanStart >= 0 &&
      s.time - s.scanStart < 6;
  const execute = useCallback(
    (raw: string) => {
      const command = raw.trim().toLowerCase();
      if (!command) return;
      dispatch({ type: "output", text: "operator@phantom:~$ " + raw.trim() });
      setHistory((h) =>
        [command, ...h.filter((x) => x !== command)].slice(0, 50),
      );
      setHistoryIndex(-1);
      setInput("");
      sound();
      const [verb, ...args] = command.split(/\s+/);
      const state = stateRef.current;
      const stationOk = (id: string) =>
        visibleStations(state).some((x) => x.id === id);
      if (verb === "help")
        dispatch({
          type: "output",
          text: "COMMANDS\nscan sector-7          Sweep the listening array\ninspect <station>      Select and inspect a station\ntrace <from> <to>      Follow a network route\nopen archive          Browse recovered files\ntune <MHz>            Set the signal receiver (80–500)\nscenario <name>       ghost-signal | lost-satellite | network-blackout | free\nrestore <station>     Restore a relay after decoding its key\nclear                 Clear the terminal\n\nTab completes commands. ↑ / ↓ recalls history. Files sometimes remember commands we forgot.",
        });
      else if (verb === "clear") dispatch({ type: "clear" });
      else if (verb === "scan" && (!args[0] || args[0] === "sector-7"))
        act({ type: "scan" });
      else if (verb === "inspect" && stationOk(args[0]))
        act({ type: "inspect", id: args[0] });
      else if (verb === "trace" && stationOk(args[0]) && stationOk(args[1]))
        act({ type: "trace", from: args[0], to: args[1] });
      else if (verb === "open" && args[0] === "archive") open("archive");
      else if (
        verb === "tune" &&
        args[0] &&
        Number.isFinite(Number(args[0])) &&
        Number(args[0]) >= 80 &&
        Number(args[0]) <= 500
      ) {
        dispatch({ type: "tune", freq: Number(args[0]) });
        open("signals");
      } else if (
        verb === "scenario" &&
        scenarios.some((x) => x.id === args[0])
      ) {
        act({ type: "scenario", id: args[0] });
        open("scenarios");
      } else if (verb === "restore" && stationOk(args[0]))
        act({ type: "restore", id: args[0] });
      else if (command === "aquarium") {
        act({ type: "secret", id: "aquarium" });
        open("secrets");
      } else if (command === "theme phosphor") {
        act({
          type: "pref",
          key: "theme",
          value: state.prefs.theme === "amber" ? "green" : "amber",
        });
        act({ type: "secret", id: "theme" });
      } else if (command === "console null") {
        dispatch({ type: "tune", freq: 108 });
        act({ type: "secret", id: "console" });
        open("secrets");
      } else
        dispatch({
          type: "output",
          text:
            "Command not recognized or argument unavailable: " +
            command +
            ". Try help, or select a suggested command. Station IDs must appear on your map.",
        });
    },
    [act, open],
  );
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setBottom(true);
        terminal.current?.focus();
        return;
      }
      if (
        (e.target as HTMLElement).matches(
          'input,textarea,select,[role="slider"]',
        )
      )
        return;
      if (e.key === "Escape") {
        if (front) close(front);
        setMobileInspector(false);
      }
      if (e.key === "1") {
        setOpened([]);
        setMinimized([]);
      }
      const item = toolsList.find((t) => t.key === e.key);
      if (item) open(item.id);
      if (e.key === "`") {
        setBottom(true);
        terminal.current?.focus();
      }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [front, open]);
  const eventClick = (target?: string) => {
    if (!target) return;
    if (target.startsWith("station:"))
      act({ type: "inspect", id: target.slice(8) });
    else if (target.startsWith("signal:")) {
      act({ type: "tune", freq: Number(target.slice(7)) });
      open("signals");
    } else if (target.startsWith("file:")) {
      setFile(target.slice(5));
      open("archive");
    } else if (target === "trace") {
      setHighlight(s.trace?.route || []);
      setMode("map");
    } else if (["archive", "secrets", "scenarios"].includes(target))
      open(target as Tool);
  };
  const preset = (value: string) => {
    act({ type: "pref", key: "workspace", value });
    setOpened(
      value === "Signal analysis"
        ? ["signals", "decrypt"]
        : value === "Archive investigation"
          ? ["archive"]
          : [],
    );
    setMinimized([]);
    setLayoutReset((v) => v + 1);
  };
  const resetLayout = () => {
    try {
      Object.keys(localStorage)
        .filter((k) => k.startsWith("phantom.window."))
        .forEach((k) => localStorage.removeItem(k));
    } catch {}
    preset("Map exploration");
    toast.success("Workspace layout reset");
  };
  const startStep = (id: string) => {
    if (id === "scan") act({ type: "scan" });
    else if (id.startsWith("signal:")) {
      act({ type: "tune", freq: Number(id.slice(7)) });
      open("signals");
    } else if (id.startsWith("puzzle:")) {
      setPuzzle(id.slice(7));
      open("decrypt");
    } else if (id.startsWith("trace:")) {
      const [, from, to] = id.split(":");
      act({ type: "trace", from, to });
    } else if (id.startsWith("file:")) {
      setFile(id.slice(5));
      open("archive");
    } else if (id.startsWith("inspect:"))
      act({ type: "inspect", id: id.slice(8) });
    else if (id.startsWith("restore:"))
      act({ type: "restore", id: id.slice(8) });
  };
  return (
    <div
      className={
        "phantom " +
        (s.prefs.crt ? "crt " : "") +
        (s.prefs.scanlines ? "scanlines " : "") +
        (s.prefs.motion === 0 || s.prefs.lightweight ? "reduced-motion " : "") +
        (s.prefs.density === "compact" ? "compact " : "") +
        (s.prefs.theme === "amber" ? "amber " : "")
      }
      style={
        {
          "--brightness": s.prefs.brightness / 100,
          "--glow": s.prefs.glow / 100,
          "--green":
            s.prefs.theme === "amber"
              ? `hsl(39 90% ${43 + s.prefs.green * 0.14}%)`
              : `hsl(112 ${Math.min(90, 35 + s.prefs.green * 0.5)}% ${42 + s.prefs.green * 0.14}%)`,
        } as React.CSSProperties
      }
    >
      <header className="topbar">
        <a className="brand" href="/" aria-label="PHANTOM Control Center">
          <span className="brand-mark">
            <Network size={25} />
          </span>
          PHANTOM<span className="brand-slash">/</span>
          <span className="brand-sub">CONTROL CENTER</span>
        </a>
        <div className="top-session">
          <span className="live-dot" />
          SYSTEM ONLINE
          <span className="vertical-rule" />
          <span>{s.prefs.operator}</span>
          <span className="operator-avatar">
            {s.prefs.operator.slice(0, 2)}
          </span>
        </div>
        <div className="top-controls">
          <span className="simulation-tag">SIMULATION</span>
          <button
            className="icon-button"
            title={s.prefs.audio ? "Mute audio" : "Enable audio"}
            aria-label={s.prefs.audio ? "Mute audio" : "Enable audio"}
            onClick={() => {
              act({ type: "pref", key: "audio", value: !s.prefs.audio });
            }}
          >
            {s.prefs.audio ? <Volume2 size={17} /> : <VolumeX size={17} />}
          </button>
          <button
            className="icon-button"
            title="Settings"
            aria-label="Settings"
            onClick={() => open("settings")}
          >
            <Settings2 size={17} />
          </button>
        </div>
      </header>
      <SidebarProvider className="app-body">
        <Sidebar collapsible="none" className="nav-rail">
          <SidebarContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  className={"nav-item " + (!front ? "active" : "")}
                  tooltip="Tactical map · 1"
                  aria-label="Tactical map"
                  onClick={() => {
                    setMinimized([...opened]);
                    setFront(null);
                  }}
                >
                  <Globe2 size={21} />
                  <span className="rail-label">Map</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              {toolsList.map(({ id, label, icon: Icon, key }) => (
                <SidebarMenuItem key={id}>
                  <SidebarMenuButton
                    className={"nav-item " + (front === id ? "active" : "")}
                    tooltip={`${label} · ${key}`}
                    aria-label={label}
                    onClick={() => {
                      open(id);
                      sound();
                    }}
                  >
                    <Icon size={21} />
                    <span className="rail-label">{label}</span>
                    {id === "signals" && <span className="nav-notification" />}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarContent>
          <div className="rail-bottom">
            <button
              className="nav-item"
              title="Secrets collection"
              aria-label="Secrets collection"
              onClick={() => open("secrets")}
            >
              <Command size={20} />
            </button>
            <button
              className="nav-item"
              title="Terminal help"
              aria-label="Terminal help"
              onClick={() => {
                execute("help");
                setBottom(true);
                terminal.current?.focus();
              }}
            >
              <HelpCircle size={19} />
            </button>
            <span className="rail-version">v4.0.7</span>
          </div>
        </Sidebar>
        <main className="main-shell">
          <div className="workspace-header">
            <div>
              <div className="workspace-breadcrumb">
                <span>WORKSPACE</span>
                <ChevronRight size={12} />
                <NativeSelect
                  aria-label="Workspace preset"
                  value={s.prefs.workspace}
                  onChange={(e) => preset(e.target.value)}
                >
                  {[
                    "Map exploration",
                    "Signal analysis",
                    "Archive investigation",
                  ].map((x) => (
                    <option key={x}>{x}</option>
                  ))}
                </NativeSelect>
              </div>
              <h1>
                Global operations
                <span className="header-cursor" />
              </h1>
            </div>
            <div className="workspace-context">
              <button
                className="scenario-select"
                onClick={() => open("scenarios")}
              >
                <span className="muted">SCENARIO</span>
                <span>
                  {scenario.name}
                  <ChevronDown size={14} />
                </span>
              </button>
              <div className="session-time">
                <span className="muted">SIMULATION TIME</span>
                <strong>
                  {clock(s.time)}
                  <small> UTC</small>
                </strong>
              </div>
            </div>
          </div>
          <div className="operations-grid">
            <div className="center-column">
              <div className="metrics-strip">
                <Metric
                  label="ACTIVE STATIONS"
                  value={String(m.online).padStart(2, "0")}
                  unit={"/ " + m.total}
                  trend="GLOBAL ARRAY"
                  icon={<Globe2 size={15} />}
                />
                <Metric
                  label="NETWORK LOAD"
                  value={String(m.load)}
                  unit="%"
                  trend={
                    scanning ? "SECTOR SCAN ACTIVE" : "WITHIN NORMAL RANGE"
                  }
                  icon={<Activity size={15} />}
                  wave={s.time}
                />
                <Metric
                  label="SIGNAL QUALITY"
                  value={String(m.quality)}
                  unit="%"
                  trend="CARRIER INTEGRITY"
                  icon={<Signal size={15} />}
                  bars
                />
                <Metric
                  label="PACKET TRAFFIC"
                  value={String(m.packets)}
                  unit="/s"
                  trend="SIMULATED THROUGHPUT"
                  icon={<Network size={15} />}
                  wave={s.time + 40}
                />
              </div>
              <TacticalMap
                state={s}
                dispatch={act}
                mode={mode}
                setMode={setMode}
                highlight={highlight}
                focusToken={focusToken}
              />
              {!s.dismissed && (
                <div className="discovery-cue">
                  <span className="cue-icon">
                    <Radio size={18} />
                  </span>
                  <div>
                    <strong>Something is out there.</strong>
                    <span>An unknown signal is repeating in sector-7.</span>
                  </div>
                  <button
                    className="cue-action"
                    onClick={() => {
                      act({ type: "scenario", id: "ghost-signal" });
                      act({ type: "scan" });
                      open("signals");
                    }}
                  >
                    Investigate signal <ArrowUpRight size={15} />
                  </button>
                  <button
                    className="icon-button"
                    aria-label="Dismiss starting cue"
                    onClick={() => act({ type: "dismiss" })}
                  >
                    <X size={15} />
                  </button>
                </div>
              )}
              {s.trace && (
                <div className="trace-strip">
                  <span className="live-dot" />
                  <strong>
                    {s.trace.done ? "TRACE COMPLETE" : "TRACING ROUTE"}
                  </strong>
                  <span>
                    {s.trace.route.map((x) => x.toUpperCase()).join(" → ")}
                  </span>
                  <Progress
                    value={Math.max(
                      0,
                      Math.min(
                        100,
                        ((s.time - s.trace.start) /
                          (s.trace.route.length * 2)) *
                          100,
                      ),
                    )}
                    className="trace-progress"
                  />
                  <button
                    className="text-button"
                    onClick={() =>
                      act({
                        type: "trace",
                        from: s.trace!.from,
                        to: s.trace!.to,
                      })
                    }
                  >
                    <RotateCcw size={12} />
                    Replay
                  </button>
                </div>
              )}
            </div>
            <aside
              className={"inspector " + (mobileInspector ? "mobile-open" : "")}
            >
              <div className="panel-heading">
                <span>
                  <Target size={14} />
                  STATION INSPECTOR
                </span>
                <span className="muted">{station.code}</span>
                <button
                  className="icon-button mobile-close"
                  aria-label="Close inspector"
                  onClick={() => setMobileInspector(false)}
                >
                  <X size={16} />
                </button>
              </div>
              <div className="station-heading">
                <div className="station-symbol">
                  <Satellite size={32} strokeWidth={1} />
                </div>
                <span className={"status-label " + status}>
                  <i />
                  {status}
                </span>
                <h2>{station.name}</h2>
                <span>{station.role}</span>
              </div>
              <div className="inspector-body">
                <div className="station-location">
                  <Globe2 size={14} />
                  {station.location}
                </div>
                <dl className="station-facts">
                  <div>
                    <dt>COORDINATES</dt>
                    <dd>
                      {Math.abs(station.lat).toFixed(2)}°{" "}
                      {station.lat >= 0 ? "N" : "S"} /{" "}
                      {Math.abs(station.lon).toFixed(2)}°{" "}
                      {station.lon >= 0 ? "E" : "W"}
                    </dd>
                  </div>
                  <div>
                    <dt>CONNECTION</dt>
                    <dd className="green">
                      {status === "silent" ? "NO CARRIER" : "AES-256 · SECURE"}
                    </dd>
                  </div>
                  <div>
                    <dt>LATENCY</dt>
                    <dd>{status === "silent" ? "—" : m.latency + " ms"}</dd>
                  </div>
                  <div>
                    <dt>LAST CONTACT</dt>
                    <dd>
                      {status === "silent"
                        ? "NO RESPONSE"
                        : clock(s.time) + " UTC"}
                    </dd>
                  </div>
                </dl>
                <div className="inspector-actions">
                  <button
                    className="primary-button"
                    onClick={() => {
                      act({ type: "scan", station: s.selected });
                      sound();
                    }}
                  >
                    <ScanLine size={15} />
                    Scan station
                  </button>
                  <button
                    className="square-button"
                    title="Focus station"
                    aria-label="Focus station"
                    onClick={() => {
                      setFocusToken((v) => v + 1);
                      setMobileInspector(false);
                    }}
                  >
                    <LocateIcon />
                  </button>
                </div>
                <button
                  className="secondary-button full"
                  onClick={() => {
                    act({
                      type: "trace",
                      from: s.selected,
                      to:
                        neighbors(s.selected).find((id) =>
                          visibleStations(s).some((n) => n.id === id),
                        ) || "atlas",
                    });
                  }}
                >
                  <Network size={15} />
                  Trace connection
                  <ChevronRight size={14} />
                </button>
                <button
                  className="text-button restore-button"
                  onClick={() => act({ type: "restore", id: s.selected })}
                >
                  <RotateCcw size={13} />
                  Restore relay
                </button>
                <div className="section-label">
                  LINKED STATIONS{" "}
                  <span>
                    {
                      neighbors(s.selected).filter((id) =>
                        visibleStations(s).some((n) => n.id === id),
                      ).length
                    }
                  </span>
                </div>
                <div className="linked-stations">
                  {neighbors(s.selected)
                    .filter((id) => visibleStations(s).some((n) => n.id === id))
                    .map((id) => (
                      <button
                        key={id}
                        onClick={() => act({ type: "inspect", id })}
                      >
                        <span>
                          <i className={statusAt(s, id)} />
                          {id.toUpperCase()}
                        </span>
                        <span className="muted">
                          {statusAt(s, id) === "silent"
                            ? "OFFLINE"
                            : 19 +
                              stations.findIndex((n) => n.id === id) * 7 +
                              " ms"}
                          <ChevronRight size={12} />
                        </span>
                      </button>
                    ))}
                </div>
                <div className="section-label">
                  ASSOCIATED FILES <FolderArchive size={13} />
                </div>
                <div className="associated-files">
                  {archives
                    .filter((f) => f.station === s.selected)
                    .slice(0, 3)
                    .map((f) => (
                      <button
                        key={f.id}
                        onClick={() => {
                          setFile(f.id);
                          open("archive");
                        }}
                      >
                        <FileText size={14} />
                        <span>{f.name}</span>
                        {f.requires && !s.discoveries.includes(f.requires) ? (
                          <LockKeyhole size={12} />
                        ) : (
                          <ArrowUpRight size={12} />
                        )}
                      </button>
                    ))}
                </div>
                <div className="station-history">
                  <div className="section-label">ACTIVITY HISTORY</div>
                  <p>{station.story}</p>
                  {s.events
                    .filter(
                      (e) =>
                        e.target === "station:" + s.selected &&
                        e.time <= s.time,
                    )
                    .slice(0, 2)
                    .map((e) => (
                      <span key={e.id}>
                        {clock(e.time)} · {e.text}
                      </span>
                    ))}
                </div>
              </div>
            </aside>
          </div>
          <button
            className="mobile-inspect-button"
            onClick={() => setMobileInspector(!mobileInspector)}
          >
            <Target size={15} />
            Inspect {station.name}
            <PanelRightOpen size={15} />
          </button>
          <div className="lower-heading">
            <button
              className={bottom ? "active" : ""}
              onClick={() => setBottom(!bottom)}
            >
              <SquareTerminal size={14} />
              COMMAND TERMINAL <span className="muted">/</span> LIVE EVENTS
              {bottom ? <ChevronDown size={13} /> : <ChevronUp size={13} />}
            </button>
            <span>
              <kbd>⌘ K</kbd> command focus
            </span>
          </div>
          {bottom && (
            <div className="lower-panels">
              <section className="terminal-panel">
                <div
                  ref={terminalScroll}
                  className="terminal-output"
                  role="log"
                  aria-label="Terminal output"
                >
                  {s.terminal.map((line, i) => (
                    <pre
                      key={i}
                      className={
                        line.startsWith("operator@")
                          ? "terminal-command"
                          : line.includes("Unknown")
                            ? "amber-text"
                            : ""
                      }
                    >
                      {line}
                    </pre>
                  ))}
                  {scanning && (
                    <p className="green">
                      Sweeping sector-7<span className="blink">_</span>
                    </p>
                  )}
                </div>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    execute(input);
                  }}
                  className="terminal-input"
                >
                  <span>
                    {s.prefs.operator.toLowerCase()}
                    <b>@phantom</b>
                    <i>:~$</i>
                  </span>
                  <input
                    ref={terminal}
                    aria-label="Terminal command"
                    value={input}
                    placeholder="Enter a command…"
                    spellCheck={false}
                    autoComplete="off"
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Tab") {
                        e.preventDefault();
                        const pool = [
                          ...suggestions,
                          ...visibleStations(s).map((n) => "inspect " + n.id),
                          ...signals.map((x) => "tune " + x.freq),
                        ];
                        setInput(
                          pool.find((x) => x.startsWith(input)) || input,
                        );
                      }
                      if (e.key === "ArrowUp") {
                        e.preventDefault();
                        const n = Math.min(
                          history.length - 1,
                          historyIndex + 1,
                        );
                        setHistoryIndex(n);
                        setInput(history[n] || "");
                      }
                      if (e.key === "ArrowDown") {
                        e.preventDefault();
                        const n = Math.max(-1, historyIndex - 1);
                        setHistoryIndex(n);
                        setInput(history[n] || "");
                      }
                    }}
                  />
                  <button
                    type="submit"
                    className="icon-button"
                    aria-label="Run command"
                  >
                    <ChevronRight size={17} />
                  </button>
                </form>
                <div className="command-suggestions">
                  {["help", "scan sector-7", "trace atlas echo"].map((x) => (
                    <button key={x} onClick={() => execute(x)}>
                      {x}
                    </button>
                  ))}
                  <span>TAB to complete</span>
                </div>
              </section>
              <section className="event-panel">
                <div className="event-toolbar">
                  <span className="section-label">
                    EVENT FEED{" "}
                    <span className="count">
                      {s.events.filter((e) => e.id > s.read).length}
                    </span>
                  </span>
                  <div>
                    <NativeSelect
                      aria-label="Filter events"
                      value={eventFilter}
                      onChange={(e) => setEventFilter(e.target.value)}
                    >
                      <option value="all">All events</option>
                      {[
                        "signal",
                        "station",
                        "archive",
                        "trace",
                        "discovery",
                      ].map((x) => (
                        <option key={x}>{x}</option>
                      ))}
                    </NativeSelect>
                    <button
                      className="icon-button"
                      aria-label={
                        feedPaused
                          ? "Resume event scrolling"
                          : "Pause event scrolling"
                      }
                      title="Pause scrolling"
                      onClick={() => {
                        setFrozenEvents(s.events);
                        setFeedPaused(!feedPaused);
                      }}
                    >
                      {feedPaused ? <Play size={12} /> : <Pause size={12} />}
                    </button>
                    <button
                      className="icon-button"
                      aria-label="Mark notifications read"
                      title="Mark notifications read"
                      onClick={() => act({ type: "read" })}
                    >
                      <Check size={13} />
                    </button>
                  </div>
                </div>
                <div className="events">
                  {(feedPaused ? frozenEvents : s.events)
                    .filter(
                      (e) =>
                        e.time <= s.time &&
                        (eventFilter === "all" || e.kind === eventFilter),
                    )
                    .slice(0, 30)
                    .map((e) => (
                      <button
                        key={e.id}
                        onClick={() => eventClick(e.target)}
                        className={
                          (e.id > s.read ? "unread " : "") +
                          (!e.target ? "non-actionable" : "")
                        }
                        disabled={!e.target}
                      >
                        <time>{clock(e.time)}</time>
                        <i
                          className={
                            e.kind === "signal" ? "unstable" : "operational"
                          }
                        />
                        <span>{e.text}</span>
                        {e.target && <ArrowUpRight size={12} />}
                      </button>
                    ))}
                  {!(feedPaused ? frozenEvents : s.events).some(
                    (e) =>
                      e.time <= s.time &&
                      (eventFilter === "all" || e.kind === eventFilter),
                  ) && (
                    <p className="empty-inline">No events in this interval.</p>
                  )}
                </div>
              </section>
            </div>
          )}
          <div className="timeline">
            <button
              className="icon-button"
              aria-label="Rewind simulation"
              title="Rewind to start"
              onClick={() => act({ type: "seek", time: 0 })}
            >
              <RotateCcw size={13} />
            </button>
            <button
              className="timeline-play"
              aria-label={s.playing ? "Pause simulation" : "Play simulation"}
              onClick={() => act({ type: "play" })}
            >
              {s.playing ? <Pause size={13} /> : <Play size={13} />}
            </button>
            <span className="timeline-time">{clock(s.time)}</span>
            <Slider
              aria-label="Simulation timeline"
              min={0}
              max={Math.max(1, s.elapsed)}
              step={1}
              value={[s.time]}
              onValueChange={([time]) => act({ type: "seek", time })}
            />
            <span className="muted">{clock(s.elapsed)}</span>
            <NativeSelect
              aria-label="Simulation speed"
              value={s.speed}
              onChange={(e) =>
                act({ type: "speed", speed: Number(e.target.value) })
              }
            >
              {[0.5, 1, 2, 4].map((v) => (
                <option key={v} value={v}>
                  {v}×
                </option>
              ))}
            </NativeSelect>
            <button
              className="timeline-mode"
              title="Return to live simulation"
              onClick={() => act({ type: "live" })}
            >
              <i className={s.playing ? "operational" : "unstable"} />
              {s.time < s.elapsed ? "REPLAY" : s.playing ? "LIVE" : "PAUSED"}
            </button>
          </div>
          <footer className="statusbar">
            <span>
              <ShieldCheck size={12} />
              LOCAL SESSION · ENCRYPTION SIMULATED
            </span>
            <div className="panel-dock">
              {opened.map((tool) => (
                <button
                  key={tool}
                  className={minimized.includes(tool) ? "minimized" : "active"}
                  onClick={() =>
                    minimized.includes(tool)
                      ? open(tool)
                      : setMinimized((v) => [...v, tool])
                  }
                >
                  {toolsList.find((t) => t.id === tool)?.label || tool}
                  <Minus size={11} />
                </button>
              ))}
            </div>
            <span>
              {s.discoveries.filter((x) => x.startsWith("secret:")).length}/5
              SECRETS <i /> PHANTOM OS 4.0.7
            </span>
          </footer>
        </main>
      </SidebarProvider>
      <div className="window-layer">
        {opened.map((tool, i) => (
          <FloatingWindow
            key={tool + "-" + layoutReset}
            id={tool}
            title={toolsList.find((t) => t.id === tool)?.label || tool}
            index={i}
            front={front === tool}
            minimized={minimized.includes(tool)}
            onFocus={() => setFront(tool)}
            onMinimize={() => {
              setMinimized((v) => [...v, tool]);
              setFront(null);
            }}
            onClose={() => close(tool)}
          >
            <Tools
              tool={tool}
              state={s}
              dispatch={act}
              open={open}
              file={file}
              setFile={setFile}
              puzzle={puzzle}
              setPuzzle={setPuzzle}
              highlight={setHighlight}
              startStep={startStep}
              execute={execute}
              sound={sound}
              resetLayout={resetLayout}
              preset={preset}
              replayBoot={() => setBoot(true)}
            />
          </FloatingWindow>
        ))}
      </div>
      {boot && (
        <div className="boot-overlay">
          <div className="boot-panel">
            <Network size={39} />
            <h2>
              PHANTOM<span>_</span>
            </h2>
            <p>CONTROL CENTER / SESSION INITIALIZATION</p>
            <div>
              {[
                "Running system diagnostics… OK",
                "Initializing instruments… OK",
                "Assembling geographic array… OK",
                "Establishing secure station links… OK",
                "Operator session active.",
              ]
                .slice(0, bootStep + 1)
                .map((l, i) => (
                  <p key={l}>
                    <span>0{i + 1}</span>
                    {l}
                    <Check size={14} />
                  </p>
                ))}
            </div>
            <Progress value={Math.min(100, (bootStep + 1) * 20)} />
            <button
              className="text-button"
              onClick={() => {
                setBoot(false);
                act({ type: "visited" });
              }}
            >
              Skip initialization <ChevronRight size={15} />
            </button>
          </div>
        </div>
      )}
      <Toaster
        theme="dark"
        position="bottom-right"
        toastOptions={{
          style: {
            background: "#101b14",
            border: "1px solid #2c4431",
            color: "#d9e7db",
            fontFamily: "var(--font-mono)",
          },
        }}
      />
    </div>
  );
}
function LocateIcon() {
  return <Target size={16} />;
}
function Metric({
  label,
  value,
  unit,
  trend,
  icon,
  wave,
  bars,
}: {
  label: string;
  value: string;
  unit: string;
  trend: string;
  icon: React.ReactNode;
  wave?: number;
  bars?: boolean;
}) {
  return (
    <div className="metric">
      <div className="metric-label">
        {label}
        {icon}
      </div>
      <div className="metric-value">
        {value}
        <span>{unit}</span>
        {wave !== undefined && (
          <svg viewBox="0 0 100 28" className="sparkline" aria-hidden="true">
            <path
              d={Array.from(
                { length: 30 },
                (_, i) =>
                  (i ? "L" : "M") +
                  (i * 3.45).toFixed(2) +
                  "," +
                  (
                    14 +
                    Math.sin((i + wave / 4) * 0.5) * 7 +
                    Math.sin(i * 2) * 3
                  ).toFixed(2),
              ).join("")}
              fill="none"
              stroke="currentColor"
              strokeWidth="1.2"
            />
          </svg>
        )}
        {bars && (
          <div className="quality-bars">
            {Array.from({ length: 12 }, (_, i) => (
              <i
                key={i}
                style={{
                  height: 9 + i * 1.3,
                  opacity: i < Number(value) / 8.4 ? 1 : 0.17,
                }}
              />
            ))}
          </div>
        )}
      </div>
      <span className="metric-detail">{trend}</span>
    </div>
  );
}
function FloatingWindow({
  id,
  title,
  index,
  front,
  minimized,
  onFocus,
  onMinimize,
  onClose,
  children,
}: {
  id: string;
  title: string;
  index: number;
  front: boolean;
  minimized: boolean;
  onFocus: () => void;
  onMinimize: () => void;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const [geometry, setGeometry] = useState({
      x: 115 + index * 30,
      y: 126 + index * 26,
      w: 760,
      h: 600,
    }),
    [max, setMax] = useState(false);
  const drag = useRef<{ x: number; y: number; sx: number; sy: number } | null>(
      null,
    ),
    ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    try {
      const saved = JSON.parse(
        localStorage.getItem("phantom.window." + id) || "null",
      );
      if (saved)
        setGeometry({
          ...saved,
          x: Math.max(0, Math.min(saved.x, innerWidth - 320)),
          y: Math.max(65, Math.min(saved.y, innerHeight - 100)),
          w: Math.min(saved.w, innerWidth - 25),
          h: Math.min(saved.h, innerHeight - 120),
        });
      else
        setGeometry((g) => ({
          ...g,
          x: Math.max(
            72,
            Math.min(g.x, innerWidth - Math.min(g.w, innerWidth - 100) - 15),
          ),
          y: Math.min(g.y, Math.max(65, innerHeight - 400)),
          w: Math.min(g.w, innerWidth - 100),
          h: Math.min(g.h, innerHeight - 130),
        }));
    } catch {}
  }, [id]);
  const save = (g: typeof geometry) => {
    setGeometry(g);
    try {
      localStorage.setItem("phantom.window." + id, JSON.stringify(g));
    } catch {}
  };
  useEffect(() => {
    const resize = () =>
      setGeometry((g) => ({
        ...g,
        x: Math.max(0, Math.min(g.x, innerWidth - 320)),
        y: Math.max(65, Math.min(g.y, innerHeight - 100)),
        w: Math.min(g.w, innerWidth - 25),
        h: Math.min(g.h, innerHeight - 120),
      }));
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);
  return (
    <section
      ref={ref}
      className={
        "floating-window " +
        (front ? "front " : "") +
        (max ? "maximized " : "") +
        (minimized ? "is-minimized" : "")
      }
      aria-label={title + " window"}
      style={{
        left: geometry.x,
        top: geometry.y,
        width: geometry.w,
        height: geometry.h,
        zIndex: front ? 40 : 25 + index,
      }}
      onPointerDown={onFocus}
      onPointerUp={() => {
        if (ref.current && !max) {
          const r = ref.current.getBoundingClientRect();
          if (r.width !== geometry.w || r.height !== geometry.h)
            save({ ...geometry, w: r.width, h: r.height });
        }
      }}
    >
      <header
        className="window-titlebar"
        onPointerDown={(e) => {
          if (
            (e.target as HTMLElement).closest("button") ||
            max ||
            innerWidth < 760
          )
            return;
          drag.current = {
            x: e.clientX,
            y: e.clientY,
            sx: geometry.x,
            sy: geometry.y,
          };
          e.currentTarget.setPointerCapture(e.pointerId);
        }}
        onPointerMove={(e) => {
          if (!drag.current) return;
          setGeometry((g) => ({
            ...g,
            x: Math.max(
              72,
              Math.min(
                innerWidth - g.w,
                e.clientX - drag.current!.x + drag.current!.sx,
              ),
            ),
            y: Math.max(
              62,
              Math.min(
                innerHeight - 100,
                e.clientY - drag.current!.y + drag.current!.sy,
              ),
            ),
          }));
        }}
        onPointerUp={() => {
          if (drag.current) {
            drag.current = null;
            save(geometry);
          }
        }}
      >
        <span>
          <span className="window-light" />
          {title.toUpperCase()}
          <small>PHANTOM / INSTRUMENT</small>
        </span>
        <div>
          <button
            title="Snap window left"
            aria-label={"Snap " + title + " left"}
            onClick={() => {
              setMax(false);
              save({
                x: 80,
                y: 86,
                w: Math.min(760, innerWidth * 0.53),
                h: innerHeight - 145,
              });
            }}
          >
            <PanelRightClose size={13} />
          </button>
          <button
            title="Snap window right"
            aria-label={"Snap " + title + " right"}
            onClick={() => {
              setMax(false);
              const width = Math.min(760, innerWidth * 0.53);
              save({
                x: innerWidth - width - 15,
                y: 86,
                w: width,
                h: innerHeight - 145,
              });
            }}
          >
            <PanelRightOpen size={13} />
          </button>
          <button
            title="Minimize"
            aria-label={"Minimize " + title}
            onClick={onMinimize}
          >
            <Minus size={15} />
          </button>
          <button
            title="Maximize"
            aria-label={"Maximize " + title}
            onClick={() => setMax(!max)}
          >
            {max ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
          </button>
          <button title="Close" aria-label={"Close " + title} onClick={onClose}>
            <X size={16} />
          </button>
        </div>
      </header>
      <div className="window-content">{children}</div>
      <div className="window-status">
        <span>LOCAL INSTRUMENT · SIMULATED DATA</span>
        <span>DRAG HEADER TO MOVE · RESIZE CORNER</span>
      </div>
    </section>
  );
}
