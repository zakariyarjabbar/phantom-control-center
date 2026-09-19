"use client";
import { useState, useEffect, useMemo, useRef } from "react";
import {
  Radio,
  Activity,
  ArrowUpRight,
  ArrowRight,
  ArrowLeft,
  Check,
  ChevronRight,
  Compass,
  ExternalLink,
  FileText,
  Folder,
  FolderOpen,
  Headphones,
  HelpCircle,
  LockKeyhole,
  Maximize2,
  Minus,
  Network,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Search,
  Settings2,
  ShieldCheck,
  Signal,
  SlidersHorizontal,
  Sparkles,
  Star,
  Target,
  Volume2,
  VolumeX,
  Waves,
  X,
  Bookmark,
  Satellite,
  ScanLine,
  CheckCircle2,
  AlertTriangle,
  Command,
  Globe2,
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import {
  stations,
  signals,
  archives,
  scenarios,
  destinations,
  byId,
  type Archive,
} from "./data";
import {
  type State,
  type Action,
  type Tool,
  clock,
  signalStrength,
  currentSignal,
  visibleStations,
  statusAt,
  packetsAt,
  telemetry,
} from "./model";
type Props = {
  tool: Tool;
  state: State;
  dispatch: (a: Action) => void;
  open: (t: Tool) => void;
  file: string;
  setFile: (f: string) => void;
  puzzle: string;
  setPuzzle: (p: string) => void;
  highlight: (r: string[]) => void;
  startStep: (s: string) => void;
  execute: (s: string) => void;
  sound: (f?: number, d?: number) => void;
  resetLayout: () => void;
  preset: (v: string) => void;
  replayBoot: () => void;
};
export default function Tools(p: Props) {
  switch (p.tool) {
    case "signals":
      return <SignalLab {...p} />;
    case "archive":
      return <ArchiveBrowser {...p} />;
    case "decrypt":
      return <DecryptLab {...p} />;
    case "stream":
      return <DataStream {...p} />;
    case "scenarios":
      return <Scenarios {...p} />;
    case "portal":
      return <Portal {...p} />;
    case "settings":
      return <Settings {...p} />;
    case "secrets":
      return <Secrets {...p} />;
  }
}
function Waveform({
  freq,
  time,
  phase = 0,
  target = false,
  locked = false,
}: {
  freq: number;
  time: number;
  phase?: number;
  target?: boolean;
  locked?: boolean;
}) {
  const path = (offset: number, noise: boolean) =>
    Array.from({ length: 240 }, (_, i) => {
      const x = (i / 239) * 600,
        y =
          70 +
          Math.sin(i * 0.075 + offset) * 28 +
          (noise
            ? Math.sin(i * 1.73 + freq) *
              Math.min(15, Math.abs(freq - 145.8) * 2)
            : 0);
      return (i ? "L" : "M") + x.toFixed(2) + "," + y.toFixed(2);
    }).join("");
  return (
    <svg
      className={"waveform " + (locked ? "locked" : "")}
      viewBox="0 0 600 140"
      role="img"
      aria-label={
        target
          ? "Target and adjustable carrier waveforms"
          : "Live signal waveform"
      }
    >
      <defs>
        <pattern
          id={"wave-grid-" + (target ? "target" : "live")}
          width="30"
          height="28"
          patternUnits="userSpaceOnUse"
        >
          <path d="M30 0H0V28" fill="none" stroke="#293c29" strokeWidth=".6" />
        </pattern>
      </defs>
      <rect
        width="600"
        height="140"
        fill={"url(#wave-grid-" + (target ? "target" : "live") + ")"}
      />
      <path d="M0 70H600" stroke="#385634" strokeDasharray="3 5" />
      {target && (
        <path
          d={path(3, false)}
          stroke="#739d71"
          strokeWidth="1.7"
          fill="none"
          strokeDasharray="4 5"
        />
      )}
      <path
        d={path(target ? phase : time * 0.15, !target && !locked)}
        fill="none"
        stroke="var(--green)"
        strokeWidth="1.5"
      />
      <text x="8" y="16">
        {target ? "PHASE ALIGNMENT" : "OSCILLOSCOPE / CH.01"}
      </text>
      <text x="516" y="129">
        20 ms/div
      </text>
    </svg>
  );
}
function SignalLab(p: Props) {
  const { state: s, dispatch, open, setPuzzle, sound } = p;
  const [entry, setEntry] = useState(s.freq.toFixed(1)),
    [error, setError] = useState("");
  const signal = currentSignal(s.freq),
    strength = signalStrength(s.freq);
  useEffect(() => setEntry(s.freq.toFixed(1)), [s.freq]);
  const tune = (freq: number) => {
    dispatch({ type: "tune", freq: Math.max(80, Math.min(500, freq)) });
    setError("");
  };
  const submit = () => {
    const f = Number(entry);
    if (!Number.isFinite(f) || f < 80 || f > 500) {
      setError("Enter a frequency from 80.0 to 500.0 MHz.");
      return;
    }
    tune(f);
  };
  return (
    <div className="tool-body signal-lab">
      <div className="tool-intro">
        <div>
          <h2>Listen beyond the noise.</h2>
          <p>Find a carrier. Follow what comes through.</p>
        </div>
        <span className={"instrument-badge " + (signal ? "locked" : "")}>
          <span className="live-dot" />
          {signal ? "CARRIER LOCKED" : "RECEIVER ACTIVE"}
        </span>
      </div>
      <div className="receiver">
        <div className="frequency-readout">
          <span>RECEIVER FREQUENCY</span>
          <div>
            <strong>{s.freq.toFixed(1)}</strong>
            <span>MHz</span>
          </div>
          <span className={signal ? "green" : "muted"}>
            {signal ? signal.name.toUpperCase() : "SEARCHING FOR CARRIER"}
          </span>
        </div>
        <div
          className="tuning-dial"
          role="slider"
          tabIndex={0}
          aria-label="Frequency dial"
          aria-valuemin={80}
          aria-valuemax={500}
          aria-valuenow={s.freq}
          aria-valuetext={s.freq.toFixed(1) + " MHz"}
          onKeyDown={(e) => {
            if (
              ["ArrowRight", "ArrowUp", "ArrowLeft", "ArrowDown"].includes(
                e.key,
              )
            ) {
              e.preventDefault();
              tune(
                s.freq +
                  (["ArrowRight", "ArrowUp"].includes(e.key) ? 0.1 : -0.1),
              );
            }
          }}
          onWheel={(e) => tune(s.freq + (e.deltaY < 0 ? 0.1 : -0.1))}
          onPointerDown={(e) => {
            const box = e.currentTarget.getBoundingClientRect(),
              a = Math.atan2(
                e.clientY - box.top - box.height / 2,
                e.clientX - box.left - box.width / 2,
              );
            tune(80 + ((a + Math.PI) / (2 * Math.PI)) * 420);
          }}
        >
          <div
            style={{
              transform: `rotate(${((s.freq - 80) / 420) * 300 - 150}deg)`,
            }}
          >
            <i />
          </div>
          <span>FINE TUNE</span>
        </div>
        <div className="strength-meter">
          <span>SIGNAL STRENGTH</span>
          <strong>
            {strength}
            <small>%</small>
          </strong>
          <div>
            {Array.from({ length: 18 }, (_, i) => (
              <i key={i} style={{ opacity: i < strength / 5.6 ? 1 : 0.15 }} />
            ))}
          </div>
          <span>{signal ? "STABLE LOCK" : "NOISE FLOOR"}</span>
        </div>
      </div>
      <div className="tuner-controls">
        <button
          className="square-button"
          aria-label="Decrease frequency"
          onClick={() => tune(s.freq - 0.1)}
        >
          <Minus size={14} />
        </button>
        <Slider
          aria-label="Receiver frequency"
          min={80}
          max={500}
          step={0.1}
          value={[s.freq]}
          onValueChange={([v]) => tune(v)}
        />
        <button
          className="square-button"
          aria-label="Increase frequency"
          onClick={() => tune(s.freq + 0.1)}
        >
          <Plus size={14} />
        </button>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <Input
            aria-label="Direct frequency entry"
            value={entry}
            onChange={(e) => setEntry(e.target.value)}
            inputMode="decimal"
          />
          <button className="secondary-button" type="submit">
            Tune
          </button>
        </form>
      </div>
      {error && (
        <p className="feedback error" role="alert">
          {error}
        </p>
      )}
      <Waveform
        freq={s.freq}
        time={s.prefs.motion === 0 ? 0 : s.time}
        locked={!!signal}
      />
      <div
        className="spectrum"
        role="img"
        aria-label="Spectrum peaks at known carrier frequencies"
      >
        {Array.from({ length: 100 }, (_, i) => {
          const f = 80 + i * 4.2,
            height =
              8 +
              Math.abs(Math.sin(i * 4.3 + s.time * 0.03)) * 10 +
              signals.reduce(
                (n, x) => n + 65 * Math.exp(-Math.pow((x.freq - f) / 4, 2)),
                0,
              );
          return (
            <i
              key={i}
              style={{
                height: height + "%",
                opacity: Math.abs(s.freq - f) < 8 ? 1 : 0.5,
              }}
            />
          );
        })}
        <span>80 MHz</span>
        <span>500 MHz</span>
      </div>
      {signal ? (
        <div className="transmission">
          <div className="transmission-heading">
            <Radio size={16} />
            <span>
              {signal.badge} / {signal.station.toUpperCase()}
            </span>
            <span>{clock(s.time)} UTC</span>
          </div>
          <p>{signal.message}</p>
          <div>
            {signal.puzzle ? (
              <button
                className="primary-button"
                onClick={() => {
                  setPuzzle(signal.puzzle!);
                  open("decrypt");
                }}
              >
                <LockKeyhole size={14} />
                Decode transmission
                <ArrowRight size={14} />
              </button>
            ) : (
              <button
                className="primary-button"
                onClick={() => {
                  p.setFile(signal.freq === 108 ? "022" : "023");
                  open("archive");
                }}
              >
                Open recovered file
                <ArrowRight size={14} />
              </button>
            )}
            <button
              className="text-button"
              onClick={() => {
                if (!s.prefs.audio) {
                  toast("Enable sound in the top bar to hear the carrier.");
                  return;
                }
                sound(signal.freq * 2, 0.8);
              }}
            >
              {" "}
              <Headphones size={14} />
              Hear carrier
            </button>
          </div>
        </div>
      ) : (
        <div className="transmission quiet">
          <Radio size={17} />
          <p>
            No intelligible transmission. Start with a known carrier below;
            145.8 MHz is repeating from the northern array.
          </p>
        </div>
      )}
      <div className="section-label">
        KNOWN FREQUENCY BANDS{" "}
        <span>
          {s.discoveries.filter((x) => x.startsWith("signal:")).length} / 6
          ACQUIRED
        </span>
      </div>
      <div className="frequency-presets">
        {signals.map((x) => (
          <button
            key={x.id}
            className={s.freq === x.freq ? "selected" : ""}
            onClick={() => tune(x.freq)}
          >
            <strong>
              {x.freq.toFixed(1)} <small>MHz</small>
            </strong>
            <span>{x.name}</span>
            {s.discoveries.includes("signal:" + x.freq) ? (
              <Check size={12} />
            ) : (
              <Radio size={12} />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
function ArchiveBrowser(p: Props) {
  const { state: s, file, setFile, dispatch } = p;
  const [folder, setFolder] = useState("All files"),
    [search, setSearch] = useState(""),
    [sort, setSort] = useState("id"),
    [playing, setPlaying] = useState(false),
    audio = useRef<HTMLAudioElement>(null);
  const f = archives.find((f) => f.id === file) || archives[0],
    locked = !!f.requires && !s.discoveries.includes(f.requires);
  const files = archives
    .filter(
      (x) =>
        (folder === "All files" || x.folder === folder) &&
        (!search ||
          (x.name + " " + x.station + " " + x.body)
            .toLowerCase()
            .includes(search.toLowerCase())),
    )
    .sort((a, b) =>
      sort === "name"
        ? a.name.localeCompare(b.name)
        : sort === "type"
          ? a.type.localeCompare(b.type)
          : a.id.localeCompare(b.id),
    );
  useEffect(() => {
    if (!locked)
      dispatch({ type: "file", id: f.id, name: f.name, unlock: f.unlock });
  }, [f.id, locked]);
  useEffect(() => {
    setPlaying(false);
    audio.current?.pause();
  }, [f.id]);
  useEffect(() => {
    if (audio.current) {
      audio.current.volume = s.prefs.effects / 100;
      audio.current.muted = !s.prefs.audio;
    }
  }, [s.prefs.audio, s.prefs.effects]);
  return (
    <div className="archive-browser">
      <div className="archive-toolbar">
        <div className="search-field">
          <Search size={15} />
          <Input
            aria-label="Search archive"
            placeholder="Search files, stations, or contents…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button
              className="icon-button"
              aria-label="Clear archive search"
              onClick={() => setSearch("")}
            >
              <X size={13} />
            </button>
          )}
        </div>
        <NativeSelect
          aria-label="Sort archive"
          value={sort}
          onChange={(e) => setSort(e.target.value)}
        >
          <option value="id">Sort: index</option>
          <option value="name">Sort: name</option>
          <option value="type">Sort: type</option>
        </NativeSelect>
      </div>
      <div className="archive-layout">
        <nav className="archive-folders" aria-label="Archive folders">
          {["All files", ...new Set(archives.map((x) => x.folder))].map((x) => (
            <button
              key={x}
              className={folder === x ? "active" : ""}
              onClick={() => setFolder(x)}
            >
              {folder === x ? <FolderOpen size={14} /> : <Folder size={14} />}
              <span>{x}</span>
              <small>
                {x === "All files"
                  ? archives.length
                  : archives.filter((f) => f.folder === x).length}
              </small>
            </button>
          ))}
          <div className="archive-index">
            <ShieldCheck size={19} />
            <span>LOCAL ARCHIVE</span>
            <strong>
              {
                archives.filter(
                  (x) => !x.requires || s.discoveries.includes(x.requires),
                ).length
              }
              <small> / 24 FILES ACCESSIBLE</small>
            </strong>
          </div>
        </nav>
        <div className="archive-main">
          <div className="file-list" role="list" aria-label="Archive files">
            {files.map((x) => (
              <button
                role="listitem"
                className={f.id === x.id ? "selected" : ""}
                key={x.id}
                onClick={() => setFile(x.id)}
              >
                {x.requires && !s.discoveries.includes(x.requires) ? (
                  <LockKeyhole size={15} />
                ) : x.type === "AUDIO" ? (
                  <Headphones size={15} />
                ) : (
                  <FileText size={15} />
                )}
                <span>
                  <strong>{x.name}</strong>
                  <small>
                    {x.station.toUpperCase()} · {x.type}
                  </small>
                </span>
                <span className="file-size">{x.size}</span>
                {s.discoveries.includes("file:" + x.id) && <Check size={12} />}
              </button>
            ))}
            {!files.length && (
              <div className="empty-state">
                <Search size={27} />
                <h3>No files found</h3>
                <p>Try another term or choose All files.</p>
                <button
                  className="text-button"
                  onClick={() => {
                    setSearch("");
                    setFolder("All files");
                  }}
                >
                  Clear search and filters
                </button>
              </div>
            )}
          </div>
          <article
            className={"file-preview " + (!locked ? "resolved" : "")}
            key={f.id + String(locked)}
          >
            <div className="file-preview-heading">
              <span>
                ARCHIVE / {f.folder.toUpperCase()} / {f.id}
              </span>
              {locked ? <LockKeyhole size={15} /> : <FileText size={15} />}
            </div>
            <h2>{f.name}</h2>
            {locked ? (
              <div className="locked-file">
                <LockKeyhole size={35} />
                <h3>Discovery required</h3>
                <p>{requirementText(f.requires!)}</p>
                <button
                  className="primary-button"
                  onClick={() => p.startStep(f.requires!)}
                >
                  Follow this clue
                  <ArrowRight size={14} />
                </button>
              </div>
            ) : (
              <>
                <pre>{f.body}</pre>
                {f.type === "AUDIO" && (
                  <div className="recording">
                    <audio
                      ref={audio}
                      src="/audio/lullaby.wav"
                      preload="none"
                      onEnded={() => setPlaying(false)}
                    />
                    <button
                      className="primary-button"
                      onClick={() => {
                        if (!s.prefs.audio) {
                          toast(
                            "Enable audio in the top bar, then play this recording.",
                          );
                          return;
                        }
                        if (playing) {
                          audio.current?.pause();
                          setPlaying(false);
                        } else
                          audio.current
                            ?.play()
                            .then(() => setPlaying(true))
                            .catch(() =>
                              toast.error(
                                "Recording could not play. The full transcript is above.",
                              ),
                            );
                      }}
                    >
                      {playing ? <Pause size={15} /> : <Play size={15} />}{" "}
                      {playing ? "Pause recording" : "Play recording"}
                    </button>
                    <span>00:08 · SYNTHESIZED TRANSMISSION</span>
                  </div>
                )}
                <div className="file-preview-footer">
                  <span>
                    <ShieldCheck size={12} />
                    INTEGRITY VERIFIED · FICTIONAL DOCUMENT
                  </span>
                  <button
                    className="text-button"
                    onClick={() => dispatch({ type: "inspect", id: f.station })}
                  >
                    Inspect {f.station.toUpperCase()}
                    <ArrowUpRight size={13} />
                  </button>
                </div>
              </>
            )}
          </article>
        </div>
      </div>
    </div>
  );
}
function requirementText(key: string) {
  if (key.startsWith("signal:"))
    return (
      "Acquire the transmission at " + key.slice(7) + " MHz in the Signal Lab."
    );
  if (key.startsWith("trace:"))
    return (
      "Complete a trace from " +
      key.split(":")[1].toUpperCase() +
      " to " +
      key.split(":")[2].toUpperCase() +
      "."
    );
  if (key === "puzzle:wave")
    return "Align the unknown waveform at 145.8 MHz to recover this archive key.";
  if (key === "puzzle:fragments")
    return "Reassemble ARGOS’s transmission at 137.5 MHz.";
  if (key === "puzzle:restore")
    return "Restore the corrupted HELIX diagnostic at 462.3 MHz.";
  return "Match the polar ident at 89.4 MHz to its station.";
}
const puzzleInfo: Record<
  string,
  {
    title: string;
    description: string;
    freq: number;
    hint: string;
    file: string;
  }
> = {
  wave: {
    title: "Align the carrier",
    description: "Match the solid carrier to the dotted reference waveform.",
    freq: 145.8,
    hint: "MIRAGE’s calibration table gives a phase offset of 3.",
    file: "004",
  },
  fragments: {
    title: "Recover the instruction",
    description:
      "Select the fragments in order to reconstruct ARGOS’s final instruction.",
    freq: 137.5,
    hint: "Begin with RESTORE. The instruction tells you what, how, and where: RESTORE LINK VIA ATLAS.",
    file: "006",
  },
  restore: {
    title: "Repair the diagnostic",
    description: "Restore the missing letter in HELIX’s carrier status.",
    freq: 462.3,
    hint: "The incident report says the carrier is LOST. The missing letter is O.",
    file: "008",
  },
  match: {
    title: "Identify the transmitter",
    description:
      "Match the message to the station described by its coordinates.",
    freq: 89.4,
    hint: "ECHO is the northernmost station: 78.22° N, Svalbard.",
    file: "010",
  },
};
function DecryptLab(p: Props) {
  const { state: s, puzzle, setPuzzle, dispatch } = p,
    [phase, setPhase] = useState(0),
    [fragments, setFragments] = useState<string[]>([]),
    [letter, setLetter] = useState(""),
    [match, setMatch] = useState(""),
    [hint, setHint] = useState(false),
    [feedback, setFeedback] = useState("");
  const info = puzzleInfo[puzzle] || puzzleInfo.wave,
    solved = s.discoveries.includes("puzzle:" + puzzle),
    available = s.discoveries.includes("signal:" + info.freq);
  const reset = () => {
    setPhase(0);
    setFragments([]);
    setLetter("");
    setMatch("");
    setHint(false);
    setFeedback("");
  };
  useEffect(reset, [puzzle]);
  const verify = () => {
    const correct =
      puzzle === "wave"
        ? phase === 3
        : puzzle === "fragments"
          ? fragments.join(" ") === "RESTORE LINK VIA ATLAS"
          : puzzle === "restore"
            ? ["O", "LOST"].includes(letter.trim().toUpperCase())
            : match === "echo";
    if (!correct) {
      setFeedback(
        "Not quite aligned. Check the clue or use a hint, then try again.",
      );
      return;
    }
    dispatch({ type: "solve", id: puzzle });
    p.sound(740, 0.4);
    setFeedback("Key recovered. The associated archive is now unlocked.");
  };
  return (
    <div className="tool-body decryption-lab">
      <div className="tool-intro">
        <div>
          <h2>Make the signal make sense.</h2>
          <p>Four small puzzles. Four doors into the network.</p>
        </div>
        <LockKeyhole size={25} />
      </div>
      <Tabs value={puzzle} onValueChange={setPuzzle}>
        <TabsList className="instrument-tabs">
          {Object.entries(puzzleInfo).map(([id]) => (
            <TabsTrigger value={id} key={id}>
              {id === "wave"
                ? "Waveform"
                : id === "fragments"
                  ? "Fragments"
                  : id === "restore"
                    ? "Corrupted text"
                    : "Station match"}
              {s.discoveries.includes("puzzle:" + id) && <Check size={12} />}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      <div className="puzzle-heading">
        <div>
          <h3>{info.title}</h3>
          <p>{info.description}</p>
        </div>
        <span className="instrument-badge">{info.freq.toFixed(1)} MHz</span>
      </div>
      {!available ? (
        <div className="puzzle-locked">
          <Radio size={32} />
          <h3>The carrier hasn’t been acquired.</h3>
          <p>First tune the receiver to {info.freq.toFixed(1)} MHz.</p>
          <button
            className="primary-button"
            onClick={() => {
              dispatch({ type: "tune", freq: info.freq });
              p.open("signals");
            }}
          >
            Acquire transmission
            <ArrowRight size={14} />
          </button>
        </div>
      ) : (
        <div className={"puzzle-workspace " + (solved ? "solved" : "")}>
          {puzzle === "wave" && (
            <>
              <Waveform
                freq={145.8}
                time={0}
                phase={solved ? 3 : phase}
                target
              />
              <div className="phase-controls">
                <button
                  className="square-button"
                  aria-label="Decrease phase"
                  disabled={solved || phase === 0}
                  onClick={() => setPhase((v) => v - 1)}
                >
                  <Minus size={15} />
                </button>
                <Slider
                  aria-label="Waveform phase"
                  min={0}
                  max={6}
                  step={1}
                  value={[solved ? 3 : phase]}
                  disabled={solved}
                  onValueChange={([v]) => setPhase(v)}
                />
                <button
                  className="square-button"
                  aria-label="Increase phase"
                  disabled={solved || phase === 6}
                  onClick={() => setPhase((v) => v + 1)}
                >
                  <Plus size={15} />
                </button>
                <strong>PHASE {solved ? 3 : phase}</strong>
              </div>
            </>
          )}
          {puzzle === "fragments" && (
            <>
              <div
                className="fragment-slots"
                aria-label="Reconstructed message"
              >
                {(solved
                  ? ["RESTORE", "LINK", "VIA", "ATLAS"]
                  : Array.from({ length: 4 }, (_, i) => fragments[i] || "")
                ).map((x, i) => (
                  <button
                    key={i}
                    aria-label={
                      x
                        ? "Remove fragment " + x
                        : "Empty fragment slot " + (i + 1)
                    }
                    disabled={!x || solved}
                    onClick={() =>
                      setFragments((f) => f.filter((_, j) => i !== j))
                    }
                  >
                    <small>0{i + 1}</small>
                    {x || "—"}
                  </button>
                ))}
              </div>
              <div className="fragment-bank">
                {["VIA", "ATLAS", "RESTORE", "LINK"].map((x) => (
                  <button
                    key={x}
                    disabled={fragments.includes(x) || solved}
                    className="secondary-button"
                    onClick={() => setFragments((f) => [...f, x])}
                  >
                    {x}
                    <Plus size={13} />
                  </button>
                ))}
              </div>
              <p className="puzzle-note">
                Click words in sequence. Click a placed word to remove it.
              </p>
            </>
          )}
          {puzzle === "restore" && (
            <>
              <div className="corrupted-message">
                <span>HELIX / DIAGNOSTIC BUFFER</span>
                <strong>
                  CARRIER L
                  <span className="corrupted-letter">{solved ? "O" : "▒"}</span>
                  ST
                </strong>
                <p>“The signal was here. Then the carrier was gone.”</p>
              </div>
              <label className="restore-input">
                Missing letter
                <Input
                  aria-label="Missing letter"
                  placeholder="Enter the missing letter"
                  maxLength={4}
                  value={solved ? "O" : letter}
                  disabled={solved}
                  onChange={(e) => setLetter(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") verify();
                  }}
                />
              </label>
            </>
          )}
          {puzzle === "match" && (
            <>
              <blockquote className="station-message">
                “78.22° north. Long polar night.
                <br />I am the northernmost listener.”
                <cite>RECOVERED IDENT / 89.4 MHz</cite>
              </blockquote>
              <div className="station-choices">
                {["atlas", "echo", "vega", "delta"].map((id) => (
                  <button
                    key={id}
                    disabled={solved}
                    onClick={() => setMatch(id)}
                    className={
                      ((solved && id === "echo") || match === id
                        ? "selected "
                        : "") + "secondary-button"
                    }
                  >
                    <Radio size={15} />
                    <span>
                      {id.toUpperCase()}
                      <small>{byId(id).location}</small>
                    </span>
                    {(match === id || (solved && id === "echo")) && (
                      <Check size={15} />
                    )}
                  </button>
                ))}
              </div>
            </>
          )}
          {solved ? (
            <div className="puzzle-success">
              <CheckCircle2 size={27} />
              <div>
                <h3>Signal resolved. A new door is open.</h3>
                <p>
                  {puzzle === "wave"
                    ? "GHOST is now on your map. Trace its connection to ATLAS."
                    : "The recovered key has unlocked a new archive document."}
                </p>
              </div>
              <button
                className="primary-button"
                onClick={() => {
                  p.setFile(info.file);
                  p.open("archive");
                }}
              >
                Open archive
                <ArrowRight size={14} />
              </button>
            </div>
          ) : (
            <>
              <div className="puzzle-actions">
                <button className="primary-button" onClick={verify}>
                  <LockKeyhole size={14} />
                  Verify solution
                </button>
                <button className="text-button" onClick={() => setHint(!hint)}>
                  <HelpCircle size={14} />
                  {hint ? "Hide hint" : "Show hint"}
                </button>
                <button className="text-button" onClick={reset}>
                  <RotateCcw size={13} />
                  Reset
                </button>
              </div>
              {feedback && (
                <p className="feedback error" role="status">
                  {feedback}
                </p>
              )}
              {hint && (
                <p className="hint">
                  <HelpCircle size={15} />
                  {info.hint}
                </p>
              )}
            </>
          )}
        </div>
      )}
      <div className="puzzle-bottom">
        <ShieldCheck size={13} />
        Decoded keys and discoveries are preserved during timeline replay.
      </div>
    </div>
  );
}
function DataStream(p: Props) {
  const { state: s, dispatch } = p,
    [tab, setTab] = useState("packets"),
    [paused, setPaused] = useState(false),
    [capture, setCapture] = useState(s.time),
    [filter, setFilter] = useState("all"),
    [type, setType] = useState("all"),
    [selected, setSelected] = useState<
      ReturnType<typeof packetsAt>[number] | null
    >(null),
    [from, setFrom] = useState(s.selected),
    [to, setTo] = useState("echo");
  const packets = packetsAt(
      s,
      paused ? Math.min(capture, s.time) : s.time,
    ).filter(
      (x) =>
        (filter === "all" || x.from === filter || x.to === filter) &&
        (type === "all" || x.kind === type),
    ),
    m = telemetry(s);
  return (
    <div className="tool-body data-stream">
      <div className="tool-intro">
        <div>
          <h2>The network, in motion.</h2>
          <p>Every packet belongs to the same simulated world.</p>
        </div>
        <span className="instrument-badge">{clock(s.time)} UTC</span>
      </div>
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="instrument-tabs">
          <TabsTrigger value="packets">
            <Activity size={14} />
            Packet stream
          </TabsTrigger>
          <TabsTrigger value="trace">
            <Network size={14} />
            Route tracer
          </TabsTrigger>
          <TabsTrigger value="telemetry">
            <Signal size={14} />
            Telemetry
          </TabsTrigger>
        </TabsList>
        <TabsContent value="packets">
          <div className="stream-toolbar">
            <button
              className="secondary-button"
              onClick={() => {
                setCapture(s.time);
                setPaused(!paused);
              }}
            >
              {paused ? <Play size={13} /> : <Pause size={13} />}{" "}
              {paused ? "Resume stream" : "Pause stream"}
            </button>
            <NativeSelect
              aria-label="Filter packets by station"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="all">All stations</option>
              {visibleStations(s).map((n) => (
                <option value={n.id} key={n.id}>
                  {n.name}
                </option>
              ))}
            </NativeSelect>
            <NativeSelect
              aria-label="Filter packets by type"
              value={type}
              onChange={(e) => setType(e.target.value)}
            >
              {["all", "telemetry", "relay", "diagnostic", "archive"].map(
                (x) => (
                  <option value={x} key={x}>
                    {x === "all" ? "All types" : x}
                  </option>
                ),
              )}
            </NativeSelect>
            <span className="muted">{packets.length} PACKETS</span>
          </div>
          <div className="packet-visual" aria-hidden="true">
            {packets.slice(0, 16).map((x, i) => (
              <div
                key={x.id}
                style={{
                  left:
                    ((i * 73 +
                      (s.prefs.motion === 0 ? 0 : paused ? capture : s.time) *
                        13) %
                      620) /
                      6.2 +
                    "%",
                  top: (i % 3) * 18 + 10,
                }}
                className={x.interrupted ? "interrupted" : ""}
              >
                <i />
                {x.kind.slice(0, 3)}
              </div>
            ))}
          </div>
          <div className="packet-table">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>PACKET / TIME</TableHead>
                  <TableHead>SOURCE → DEST.</TableHead>
                  <TableHead>TYPE</TableHead>
                  <TableHead>BYTES</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {packets.map((x) => (
                  <TableRow
                    key={x.id}
                    className={selected?.id === x.id ? "selected" : ""}
                  >
                    <TableCell>
                      <button
                        onClick={() => {
                          setSelected(x);
                          p.highlight(x.route);
                          dispatch({ type: "select", id: x.from });
                        }}
                      >
                        {x.id}
                        <span>{clock(x.time)}</span>
                      </button>
                    </TableCell>
                    <TableCell>
                      {x.from.toUpperCase()} <ArrowRight size={10} />{" "}
                      {x.to.toUpperCase()}
                    </TableCell>
                    <TableCell>
                      <span className={x.interrupted ? "amber-text" : ""}>
                        {x.interrupted ? "INTERRUPTED" : x.kind}
                      </span>
                    </TableCell>
                    <TableCell>{x.bytes}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {!packets.length && (
            <div className="empty-state">
              <Activity size={26} />
              <h3>No packets in this capture.</h3>
              <p>Change filters or let the simulation advance.</p>
            </div>
          )}
          {selected && (
            <div className="packet-inspector">
              <div className="section-label">
                {selected.id} / PACKET INSPECTOR
                <button
                  className="icon-button"
                  aria-label="Close packet inspector"
                  onClick={() => setSelected(null)}
                >
                  <X size={13} />
                </button>
              </div>
              <dl>
                <div>
                  <dt>Timestamp</dt>
                  <dd>{clock(selected.time)} UTC</dd>
                </div>
                <div>
                  <dt>Source / destination</dt>
                  <dd>
                    {selected.from.toUpperCase()} → {selected.to.toUpperCase()}
                  </dd>
                </div>
                <div>
                  <dt>Route</dt>
                  <dd>
                    {selected.route.map((x) => x.toUpperCase()).join(" → ")}
                  </dd>
                </div>
                <div>
                  <dt>Payload</dt>
                  <dd>{selected.payload}</dd>
                </div>
                <div>
                  <dt>Delivery</dt>
                  <dd>
                    {selected.interrupted
                      ? "Carrier interruption"
                      : "Confirmed in simulation"}
                  </dd>
                </div>
              </dl>
              <p>The corresponding connection is highlighted on the map.</p>
            </div>
          )}
        </TabsContent>
        <TabsContent value="trace">
          <div className="route-builder">
            <label>
              ORIGIN
              <NativeSelect
                aria-label="Trace origin"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
              >
                {visibleStations(s).map((n) => (
                  <option key={n.id} value={n.id}>
                    {n.name}
                  </option>
                ))}
              </NativeSelect>
            </label>
            <ArrowRight size={19} />
            <label>
              DESTINATION
              <NativeSelect
                aria-label="Trace destination"
                value={to}
                onChange={(e) => setTo(e.target.value)}
              >
                {visibleStations(s).map((n) => (
                  <option key={n.id} value={n.id}>
                    {n.name}
                  </option>
                ))}
              </NativeSelect>
            </label>
            <button
              className="primary-button"
              disabled={from === to}
              onClick={() => dispatch({ type: "trace", from, to })}
            >
              <Network size={15} />
              Trace route
            </button>
          </div>
          {from === to && (
            <p className="feedback">Choose two different stations.</p>
          )}
          {s.trace ? (
            <div className="trace-detail">
              <div className="trace-detail-title">
                <h3>
                  {s.trace.from.toUpperCase()} → {s.trace.to.toUpperCase()}
                </h3>
                <span className="instrument-badge">
                  {s.trace.done ? "TRACE COMPLETE" : "TRACING"}
                </span>
              </div>
              <Progress
                value={Math.max(
                  0,
                  Math.min(
                    100,
                    ((s.time - s.trace.start) / (s.trace.route.length * 2)) *
                      100,
                  ),
                )}
              />
              <div className="hop-list">
                {s.trace.route.map((id, i) => {
                  const reached = s.time - s.trace!.start >= i * 2,
                    status = statusAt(s, id);
                  return (
                    <div key={id} className={reached ? "reached" : ""}>
                      <span className="hop-index">0{i}</span>
                      <div>
                        <strong>{id.toUpperCase()}</strong>
                        <span>{byId(id).location}</span>
                      </div>
                      <span>{reached ? 18 + i * 11 + " ms" : "Waiting"}</span>
                      <span
                        className={status === "silent" ? "amber-text" : "green"}
                      >
                        {status === "silent"
                          ? "INTERRUPTED"
                          : status === "unstable"
                            ? "DEGRADED"
                            : "STABLE"}
                      </span>
                      {reached ? <Check size={14} /> : <Radio size={14} />}
                    </div>
                  );
                })}
              </div>
              <div className="trace-summary">
                <span>{s.trace.route.length - 1} HOPS</span>
                <span>
                  {s.trace.route.some((id) => statusAt(s, id) === "silent")
                    ? "CARRIER INTERRUPTION DETECTED"
                    : "ROUTE QUALITY " + m.quality + "%"}
                </span>
                <button
                  className="text-button"
                  onClick={() =>
                    dispatch({
                      type: "trace",
                      from: s.trace!.from,
                      to: s.trace!.to,
                    })
                  }
                >
                  <RotateCcw size={13} />
                  Replay trace
                </button>
              </div>
            </div>
          ) : (
            <div className="empty-state">
              <Network size={34} />
              <h3>Choose the ends. Follow the path.</h3>
              <p>
                Trace through intermediate stations and watch each hop on the
                map.
              </p>
            </div>
          )}
        </TabsContent>
        <TabsContent value="telemetry">
          <div className="telemetry-grid">
            {[
              {
                label: "Network load",
                unit: "%",
                value: m.load,
                fn: (t: number) => telemetry(s, t).load,
                detail: "Activity from scans, routes, and baseline traffic.",
              },
              {
                label: "Connection quality",
                unit: "%",
                value: m.quality,
                fn: (t: number) => telemetry(s, t).quality,
                detail: "Operational stations divided by discovered stations.",
              },
              {
                label: "Packet activity",
                unit: "pkt/s",
                value: m.packets,
                fn: (t: number) => telemetry(s, t).packets,
                detail: "Deterministic throughput linked to network load.",
              },
              {
                label: "Station availability",
                unit: "online",
                value: m.online,
                fn: (t: number) => telemetry(s, t).online,
                detail: "Responds to scenario failures and timed restorations.",
              },
            ].map((metric, i) => {
              const values = Array.from({ length: 60 }, (_, j) =>
                  metric.fn(Math.max(0, s.time - 59 + j)),
                ),
                max = Math.max(...values) * 1.2 || 1;
              return (
                <div key={metric.label}>
                  <span>{metric.label}</span>
                  <strong>
                    {metric.value}
                    <small>{metric.unit}</small>
                  </strong>
                  <svg
                    viewBox="0 0 300 100"
                    role="img"
                    aria-label={
                      metric.label + " for the past 60 simulation seconds"
                    }
                  >
                    <path
                      d="M0 25H300 M0 50H300 M0 75H300"
                      stroke="#2b4028"
                      strokeDasharray="2 4"
                    />
                    <path
                      d={values
                        .map(
                          (v, j) =>
                            (j ? "L" : "M") +
                            (j * 300) / 59 +
                            "," +
                            (95 - (v / max) * 85),
                        )
                        .join("")}
                      fill="none"
                      stroke="var(--green)"
                      strokeWidth="1.6"
                    />
                  </svg>
                  <p>{metric.detail}</p>
                </div>
              );
            })}
          </div>
          <p className="puzzle-bottom">
            Graphs follow the shared clock. Rewind the timeline to inspect
            earlier states.
          </p>
        </TabsContent>
      </Tabs>
    </div>
  );
}
function Scenarios(p: Props) {
  const { state: s, dispatch } = p;
  const [selected, setSelected] = useState(
    s.scenario === "free" ? "ghost-signal" : s.scenario,
  );
  const scene = scenarios.find((x) => x.id === selected)!,
    done = scene.steps.filter(([id]) => s.discoveries.includes(id)).length,
    complete = done === scene.steps.length && done > 0,
    next = scene.steps.find(([id]) => !s.discoveries.includes(id));
  return (
    <div className="tool-body scenarios">
      <div className="tool-intro">
        <div>
          <h2>Every silence has a story.</h2>
          <p>Choose an investigation, or follow your own curiosity.</p>
        </div>
        <LayersIcon />
      </div>
      <div className="scenario-options">
        {scenarios
          .filter((x) => x.id !== "free")
          .map((x, i) => (
            <button
              key={x.id}
              className={selected === x.id ? "selected" : ""}
              onClick={() => setSelected(x.id)}
            >
              <span>{x.code}</span>
              {i === 0 ? (
                <Radio size={25} />
              ) : i === 1 ? (
                <Satellite size={25} />
              ) : (
                <Network size={25} />
              )}
              <h3>{x.name}</h3>
              <p>
                {x.steps.filter(([id]) => s.discoveries.includes(id)).length} /{" "}
                {x.steps.length} discoveries
              </p>
              {x.id === s.scenario && (
                <span className="scenario-active">ACTIVE</span>
              )}
            </button>
          ))}
      </div>
      <div className="scenario-detail">
        <div className="scenario-detail-heading">
          <h3>{scene.name}</h3>
          <span>
            {complete
              ? "RESOLVED"
              : done + " / " + scene.steps.length + " OBJECTIVES"}
          </span>
        </div>
        <p>{scene.description}</p>
        <Progress value={(done / scene.steps.length) * 100} />
        <ol className="objectives">
          {scene.steps.map(([id, label], i) => (
            <li
              key={id}
              className={
                s.discoveries.includes(id)
                  ? "complete"
                  : next?.[0] === id
                    ? "current"
                    : ""
              }
            >
              <span>
                {s.discoveries.includes(id) ? (
                  <Check size={13} />
                ) : (
                  String(i + 1).padStart(2, "0")
                )}
              </span>
              <div>
                <strong>{label}</strong>
                {next?.[0] === id && <small>NEXT ACTION</small>}
              </div>
              <button
                className="text-button"
                onClick={() => {
                  if (s.scenario !== scene.id)
                    dispatch({ type: "scenario", id: scene.id });
                  p.startStep(id);
                }}
              >
                {s.discoveries.includes(id) ? "Revisit" : "Open"}
                <ArrowUpRight size={13} />
              </button>
            </li>
          ))}
        </ol>
        {complete ? (
          <div className="scenario-complete">
            <CheckCircle2 size={35} />
            <h3>
              {scene.id === "ghost-signal"
                ? "The forgotten station is listening."
                : scene.id === "lost-satellite"
                  ? "ARGOS has found its way home."
                  : "The backbone is breathing again."}
            </h3>
            <p>
              {scene.id === "ghost-signal"
                ? "GHOST was never an intruder. It has been keeping the final messages of retired stations. A fifth voice waits in its archive."
                : scene.id === "lost-satellite"
                  ? "The orbital handoff is restored. The satellite’s archive is safe, and VEGA has a stable carrier again."
                  : "HELIX and ORION are online. Rewind the clock to inspect the cascade, or explore the recovered network."}
            </p>
            <button
              className="secondary-button"
              onClick={() => {
                dispatch({ type: "scenario", id: "free" });
                toast.success(
                  "Free exploration enabled. Your discoveries are preserved.",
                );
              }}
            >
              Continue exploring
              <Compass size={15} />
            </button>
          </div>
        ) : (
          <button
            className="primary-button"
            onClick={() => {
              if (s.scenario !== scene.id)
                dispatch({ type: "scenario", id: scene.id });
              if (next) p.startStep(next[0]);
            }}
          >
            {s.scenario === scene.id
              ? "Continue investigation"
              : "Begin investigation"}
            <ArrowRight size={15} />
          </button>
        )}
      </div>
      <button
        className="free-explore"
        onClick={() => {
          dispatch({ type: "scenario", id: "free" });
          toast(
            "Free exploration is active. All discovered content remains accessible.",
          );
        }}
      >
        <Compass size={20} />
        <span>
          <strong>Free exploration</strong>
          <small>No objectives. Let the network lead.</small>
        </span>
        <ArrowUpRight size={16} />
      </button>
    </div>
  );
}
function LayersIcon() {
  return <Network size={25} />;
}
function Portal(p: Props) {
  const { state: s, dispatch } = p,
    [search, setSearch] = useState(""),
    [category, setCategory] = useState("All destinations"),
    [collection, setCollection] = useState("all");
  const list = destinations.filter(
    (d) =>
      (category === "All destinations" || d.category === category) &&
      (collection === "all" ||
        (collection === "saved" ? s.coordinates : s.favorites).includes(
          d.id,
        )) &&
      (d.name + " " + d.description + " " + d.domain)
        .toLowerCase()
        .includes(search.toLowerCase()),
  );
  return (
    <div className="tool-body portal">
      <div className="tool-intro">
        <div>
          <h2>A door to the actual world.</h2>
          <p>Real websites. Worthwhile detours.</p>
        </div>
        <span className="external-badge">
          <ExternalLink size={12} />
          EXTERNAL DIRECTORY
        </span>
      </div>
      <div className="portal-search">
        <div className="search-field">
          <Search size={15} />
          <Input
            aria-label="Search destinations"
            placeholder="Find a destination…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <NativeSelect
          aria-label="Destination category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          {[
            "All destinations",
            "Space",
            "Technology",
            "Art",
            "Interactive",
            "Education",
          ].map((x) => (
            <option key={x}>{x}</option>
          ))}
        </NativeSelect>
      </div>
      <Tabs value={collection} onValueChange={setCollection}>
        <TabsList className="instrument-tabs">
          <TabsTrigger value="all">
            Directory <span>{destinations.length}</span>
          </TabsTrigger>
          <TabsTrigger value="favorites">
            <Star size={12} />
            Favorites <span>{s.favorites.length}</span>
          </TabsTrigger>
          <TabsTrigger value="saved">
            <Bookmark size={12} />
            Coordinates <span>{s.coordinates.length}</span>
          </TabsTrigger>
        </TabsList>
      </Tabs>
      <div className="destination-list">
        {list.map((d, i) => (
          <article key={d.id}>
            <span className="destination-index">
              {String(destinations.indexOf(d) + 1).padStart(2, "0")}
            </span>
            <div className="destination-text">
              <div>
                <span className="destination-category">{d.category}</span>
                <h3>{d.name}</h3>
              </div>
              <p>{d.description}</p>
              <a href={d.url} target="_blank" rel="noopener noreferrer">
                {d.domain}
                <ArrowUpRight size={14} />
                <span className="sr-only">opens in a new tab</span>
              </a>
            </div>
            <div className="destination-actions">
              <button
                className={
                  "icon-button " +
                  (s.favorites.includes(d.id) ? "selected" : "")
                }
                aria-label={
                  (s.favorites.includes(d.id) ? "Unfavorite " : "Favorite ") +
                  d.name
                }
                aria-pressed={s.favorites.includes(d.id)}
                onClick={() => dispatch({ type: "favorites", id: d.id })}
              >
                <Star
                  size={16}
                  fill={s.favorites.includes(d.id) ? "currentColor" : "none"}
                />
              </button>
              <button
                className={
                  "icon-button " +
                  (s.coordinates.includes(d.id) ? "selected" : "")
                }
                aria-label={
                  (s.coordinates.includes(d.id)
                    ? "Remove from Coordinates: "
                    : "Save to Coordinates: ") + d.name
                }
                aria-pressed={s.coordinates.includes(d.id)}
                onClick={() => dispatch({ type: "coordinates", id: d.id })}
              >
                <Bookmark
                  size={16}
                  fill={s.coordinates.includes(d.id) ? "currentColor" : "none"}
                />
              </button>
            </div>
          </article>
        ))}
      </div>
      {!list.length && (
        <div className="empty-state">
          <Compass size={32} />
          <h3>
            {collection === "saved"
              ? "Your Coordinates are waiting."
              : "No destinations found."}
          </h3>
          <p>
            {collection === "saved"
              ? "Save a website with its bookmark control to keep it here."
              : "Try a different search or category."}
          </p>
          <button
            className="text-button"
            onClick={() => {
              setSearch("");
              setCategory("All destinations");
              setCollection("all");
            }}
          >
            Browse all destinations
            <ArrowRight size={13} />
          </button>
        </div>
      )}
      <p className="portal-note">
        <ExternalLink size={13} />
        Links open in a new tab. Domains and descriptions verified September 17,
        2026. These destinations are separate from PHANTOM’s fictional network.
      </p>
    </div>
  );
}
function Settings(p: Props) {
  const { state: s, dispatch } = p,
    [reset, setReset] = useState(""),
    [fullscreen, setFullscreen] = useState(false);
  const pref = (key: string, value: any) =>
    dispatch({ type: "pref", key, value });
  useEffect(() => {
    const f = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", f);
    return () => document.removeEventListener("fullscreenchange", f);
  }, []);
  return (
    <div className="tool-body settings">
      <div className="tool-intro">
        <div>
          <h2>Your station. Your settings.</h2>
          <p>Saved on this device as you make changes.</p>
        </div>
        <Settings2 size={24} />
      </div>
      <section>
        <h3>Operator & workspace</h3>
        <label className="settings-field">
          Operator name
          <Input
            aria-label="Operator name"
            value={s.prefs.operator}
            maxLength={24}
            onChange={(e) =>
              pref("operator", e.target.value.replace(/[^a-zA-Z0-9_ -]/g, ""))
            }
          />
        </label>
        <label className="settings-field">
          Workspace preset
          <NativeSelect
            aria-label="Settings workspace preset"
            value={s.prefs.workspace}
            onChange={(e) => p.preset(e.target.value)}
          >
            {[
              "Map exploration",
              "Signal analysis",
              "Archive investigation",
            ].map((x) => (
              <option key={x}>{x}</option>
            ))}
          </NativeSelect>
        </label>
        <label className="settings-field">
          Interface density
          <NativeSelect
            aria-label="Interface density"
            value={s.prefs.density}
            onChange={(e) => pref("density", e.target.value)}
          >
            <option value="comfortable">Comfortable</option>
            <option value="compact">Compact</option>
          </NativeSelect>
        </label>
        <button
          className="secondary-button"
          onClick={async () => {
            try {
              if (document.fullscreenElement) await document.exitFullscreen();
              else await document.documentElement.requestFullscreen();
            } catch {
              toast(
                "Fullscreen is unavailable in this browser. Maximize the window for a cinematic view.",
              );
            }
          }}
        >
          <Maximize2 size={14} />
          {fullscreen
            ? "Exit cinematic fullscreen"
            : "Enter cinematic fullscreen"}
        </button>
      </section>
      <section>
        <h3>Display</h3>
        {[
          { key: "brightness", label: "Display brightness", min: 65, max: 115 },
          { key: "green", label: "Phosphor intensity", min: 20, max: 100 },
          { key: "glow", label: "Station glow", min: 0, max: 100 },
          { key: "motion", label: "Animation intensity", min: 0, max: 100 },
        ].map((x) => (
          <div className="settings-range" key={x.key}>
            <label>
              {x.label}
              <strong>{s.prefs[x.key as keyof typeof s.prefs]}%</strong>
            </label>
            <Slider
              aria-label={x.label}
              min={x.min}
              max={x.max}
              value={[s.prefs[x.key as keyof typeof s.prefs] as number]}
              onValueChange={([v]) => pref(x.key, v)}
            />
          </div>
        ))}
        <Toggle
          label="CRT texture"
          description="A restrained grain over the interface."
          value={s.prefs.crt}
          onChange={(v) => pref("crt", v)}
        />
        <Toggle
          label="Scan lines"
          description="Fine horizontal lines over the map."
          value={s.prefs.scanlines}
          onChange={(v) => pref("scanlines", v)}
        />
        <Toggle
          label="Reduced motion"
          description="Hold visual effects and remove transitions."
          value={s.prefs.motion === 0}
          onChange={(v) => pref("motion", v ? 0 : 65)}
        />
        <Toggle
          label="Lightweight graphics"
          description="Reduce packet effects and hold globe rotation."
          value={s.prefs.lightweight}
          onChange={(v) => pref("lightweight", v)}
        />
        {s.discoveries.includes("secret:theme") && (
          <label className="settings-field">
            Workstation theme
            <NativeSelect
              aria-label="Workstation theme"
              value={s.prefs.theme}
              onChange={(e) => pref("theme", e.target.value)}
            >
              <option value="green">PHANTOM green</option>
              <option value="amber">Original amber phosphor</option>
            </NativeSelect>
          </label>
        )}
      </section>
      <section>
        <h3>Audio</h3>
        <Toggle
          label="Enable sound"
          description="Audio begins only when you enable this control."
          value={s.prefs.audio}
          onChange={(v) => pref("audio", v)}
        />
        {[
          { key: "ambience", label: "Low electronic ambience" },
          { key: "effects", label: "Interface & transmission effects" },
        ].map((x) => (
          <div className="settings-range" key={x.key}>
            <label>
              {x.label}
              <strong>{s.prefs[x.key as "ambience" | "effects"]}%</strong>
            </label>
            <Slider
              aria-label={x.label}
              min={0}
              max={100}
              value={[s.prefs[x.key as "ambience" | "effects"]]}
              onValueChange={([v]) => pref(x.key, v)}
            />
          </div>
        ))}
        <button
          className="text-button"
          onClick={() =>
            s.prefs.audio
              ? p.sound(660, 0.15)
              : toast("Enable sound to preview the interface tone.")
          }
        >
          <Volume2 size={14} />
          Preview sound
        </button>
      </section>
      <section>
        <h3>Session controls</h3>
        <div className="reset-controls">
          <button className="secondary-button" onClick={p.replayBoot}>
            <Play size={14} />
            Replay startup
          </button>
          <button className="secondary-button" onClick={p.resetLayout}>
            <RotateCcw size={14} />
            Reset layout
          </button>
          <button
            className="secondary-button"
            onClick={() => setReset("preferences")}
          >
            Reset preferences
          </button>
          <button
            className="secondary-button danger"
            onClick={() => setReset("progress")}
          >
            Reset simulation progress
          </button>
        </div>
        <p>
          Layout, preferences, and simulation progress can be reset separately.
          Favorites and saved Coordinates are preserved.
        </p>
      </section>
      <AlertDialog open={!!reset} onOpenChange={(v) => !v && setReset("")}>
        <AlertDialogContent className="reset-dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Reset {reset}?</AlertDialogTitle>
            <AlertDialogDescription>
              {reset === "progress"
                ? "This clears scenario progress, station discoveries, secrets, and event history on this device. Your saved websites and display preferences stay."
                : "This restores display, audio, operator, and workspace preferences. Your discoveries and saved websites stay."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep current state</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                dispatch({
                  type: reset === "progress" ? "reset-progress" : "reset-prefs",
                });
                toast.success("Reset complete");
                setReset("");
              }}
            >
              Reset {reset}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
function Toggle({
  label,
  description,
  value,
  onChange,
}: {
  label: string;
  description: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="settings-toggle">
      <span>
        <strong>{label}</strong>
        <small>{description}</small>
      </span>
      <Switch aria-label={label} checked={value} onCheckedChange={onChange} />
    </label>
  );
}
function Secrets(p: Props) {
  const s = p.state;
  const secrets = [
    {
      id: "console",
      title: "The abandoned console",
      clue: "Read SPECTRE’s final shift.",
      body: "An operator left a workstation running so the messages would have somewhere to arrive.",
      action: () => {
        p.setFile("014");
        p.open("archive");
      },
    },
    {
      id: "aquarium",
      title: "A little company",
      clue: "SPECTRE left instructions for a screensaver.",
      body: "A tiny world, still moving in a forgotten terminal.",
      action: () => p.execute("aquarium"),
    },
    {
      id: "transmission",
      title: "The fifth voice",
      clue: "Trace the forgotten station. Read the first operator’s archive.",
      body: "Four operators attended the first test. Five voices are on the tape.",
      action: () => {
        p.setFile("015");
        p.open("archive");
      },
    },
    {
      id: "null",
      title: "A place for lost messages",
      clue: "Listen to the quiet channel at 108.0 MHz.",
      body: "NULL is visible on the map. Some stations exist to listen.",
      action: () => {
        p.dispatch({ type: "tune", freq: 108 });
        p.open("signals");
      },
    },
    {
      id: "theme",
      title: "Original phosphor",
      clue: "The first operator kept a command in the margin.",
      body: "The original amber workstation has been recovered.",
      action: () => p.execute("theme phosphor"),
    },
  ];
  return (
    <div className="tool-body secrets">
      <div className="tool-intro">
        <div>
          <h2>The things left behind.</h2>
          <p>
            {
              secrets.filter((x) => s.discoveries.includes("secret:" + x.id))
                .length
            }{" "}
            of 5 secrets discovered.
          </p>
        </div>
        <Command size={26} />
      </div>
      {s.discoveries.includes("secret:aquarium") && (
        <div className="aquarium">
          <span>ABANDONED CONSOLE / SCREENSAVER RESTORED</span>
          <pre>{`      .        o              .
  ${s.prefs.motion > 0 && s.time % 2 ? " ><(((°>" : "  ><(((°>"}                 <°)))><
               o      .
    <°)))><          ${s.prefs.motion > 0 && s.time % 2 ? "  ><°>" : " ><°> "}
 .       |   |     o       .
    \\  /|  /|    |\\  /|
~~~~~\\/~|~/~|~~~~|~\\/~|~~~~~`}</pre>
          <p>“Feed the fish. Keep the light on.”</p>
        </div>
      )}
      <div className="secret-list">
        {secrets.map((x, i) => {
          const found = s.discoveries.includes("secret:" + x.id);
          return (
            <article key={x.id}>
              <span className={"secret-symbol " + (found ? "found" : "")}>
                {found ? <Check size={21} /> : <LockKeyhole size={20} />}
              </span>
              <div>
                <h3>{found ? x.title : "Unrecovered / 0" + (i + 1)}</h3>
                <p>{found ? x.body : x.clue}</p>
              </div>
              <button className="text-button" onClick={x.action}>
                {found ? "Open" : "Follow clue"}
                <ArrowUpRight size={13} />
              </button>
            </article>
          );
        })}
      </div>
    </div>
  );
}
