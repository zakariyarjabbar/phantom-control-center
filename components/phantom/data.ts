export type Status = "operational" | "unstable" | "silent";
export type Station = {
  id: string;
  name: string;
  code: string;
  location: string;
  lat: number;
  lon: number;
  status: Status;
  role: string;
  cluster: string;
  hidden?: boolean;
  story: string;
};
export const stations: Station[] = [
  {
    id: "atlas",
    name: "ATLAS",
    code: "STN-001",
    location: "Reykjavík, Iceland",
    lat: 64.15,
    lon: -21.94,
    status: "operational",
    role: "Primary relay",
    cluster: "Atlantic",
    story:
      "The original north Atlantic relay. Its cold-storage array has retained every transmission since the first PHANTOM session.",
  },
  {
    id: "echo",
    name: "ECHO",
    code: "STN-002",
    location: "Svalbard, Norway",
    lat: 78.22,
    lon: 15.63,
    status: "unstable",
    role: "Polar listening post",
    cluster: "Atlantic",
    story:
      "An unattended receiver at the edge of the polar night. A recurring signal is arriving from a station that does not exist.",
  },
  {
    id: "nexus",
    name: "NEXUS",
    code: "STN-003",
    location: "New York, USA",
    lat: 40.71,
    lon: -74.01,
    status: "operational",
    role: "Network exchange",
    cluster: "Americas",
    story:
      "The western backbone distributes packets between the continental array and the Atlantic cable.",
  },
  {
    id: "cipher",
    name: "CIPHER",
    code: "STN-004",
    location: "London, United Kingdom",
    lat: 51.51,
    lon: -0.13,
    status: "operational",
    role: "Cryptographic vault",
    cluster: "Atlantic",
    story:
      "Every archive key passes through CIPHER. A recent checksum error appears deliberate.",
  },
  {
    id: "vega",
    name: "VEGA",
    code: "STN-005",
    location: "Tokyo, Japan",
    lat: 35.68,
    lon: 139.69,
    status: "operational",
    role: "Orbital telemetry",
    cluster: "Pacific",
    story:
      "Tracks the lost ARGOS relay. The last clean signal was recorded at 137.5 MHz.",
  },
  {
    id: "orion",
    name: "ORION",
    code: "STN-006",
    location: "Singapore",
    lat: 1.35,
    lon: 103.82,
    status: "operational",
    role: "Equatorial uplink",
    cluster: "Pacific",
    story:
      "A low-latency uplink serving the eastern arc. Every third packet contains a duplicated timestamp.",
  },
  {
    id: "delta",
    name: "DELTA",
    code: "STN-007",
    location: "Cape Town, South Africa",
    lat: -33.93,
    lon: 18.42,
    status: "operational",
    role: "Southern repeater",
    cluster: "Southern",
    story:
      "A quiet repeater that can bypass the northern backbone if HELIX loses its carrier.",
  },
  {
    id: "spectre",
    name: "SPECTRE",
    code: "STN-008",
    location: "São Paulo, Brazil",
    lat: -23.55,
    lon: -46.63,
    status: "silent",
    role: "Dormant field station",
    cluster: "Americas",
    story:
      "The operator left a console running. A maintenance note asks whoever finds it to feed the fish.",
  },
  {
    id: "zenith",
    name: "ZENITH",
    code: "STN-009",
    location: "Sydney, Australia",
    lat: -33.87,
    lon: 151.21,
    status: "operational",
    role: "Deep-space receiver",
    cluster: "Pacific",
    story:
      "Preserves transmissions that arrive too late. One recording is dated eleven minutes into the future.",
  },
  {
    id: "helix",
    name: "HELIX",
    code: "STN-010",
    location: "New Delhi, India",
    lat: 28.61,
    lon: 77.21,
    status: "unstable",
    role: "Backbone router",
    cluster: "Pacific",
    story:
      "Oscillating power threatens the eastern route. Restoring the diagnostic word will authorize a controlled restart.",
  },
  {
    id: "pulse",
    name: "PULSE",
    code: "STN-011",
    location: "San Francisco, USA",
    lat: 37.77,
    lon: -122.42,
    status: "operational",
    role: "Packet observatory",
    cluster: "Americas",
    story:
      "Records the shapes of network traffic. Its operators noticed the ghost frequency before anyone heard it.",
  },
  {
    id: "mirage",
    name: "MIRAGE",
    code: "STN-012",
    location: "Cairo, Egypt",
    lat: 30.04,
    lon: 31.24,
    status: "operational",
    role: "Desert relay",
    cluster: "Atlantic",
    story:
      "A relay hidden in a disused observatory. Its calibration tables explain the phase of the unknown signal.",
  },
  {
    id: "aurora",
    name: "AURORA",
    code: "STN-013",
    location: "Anchorage, Alaska",
    lat: 61.22,
    lon: -149.9,
    status: "operational",
    role: "Magnetosphere monitor",
    cluster: "Americas",
    story:
      "The auroral instruments keep finding a second rhythm beneath the solar noise.",
  },
  {
    id: "kestrel",
    name: "KESTREL",
    code: "STN-014",
    location: "Santiago, Chile",
    lat: -33.45,
    lon: -70.67,
    status: "operational",
    role: "Mountain receiver",
    cluster: "Southern",
    story:
      "Its view of the sky makes KESTREL an emergency handoff point for orbital traffic.",
  },
  {
    id: "ghost",
    name: "GHOST",
    code: "STN-015",
    location: "East Greenland",
    lat: 70.12,
    lon: -35.8,
    status: "operational",
    role: "Unlisted relay",
    cluster: "Atlantic",
    hidden: true,
    story:
      "A station removed from every official chart. The carrier has been waiting for someone to answer.",
  },
  {
    id: "null",
    name: "NULL",
    code: "STN-000",
    location: "Central Pacific",
    lat: -9,
    lon: -155,
    status: "silent",
    role: "Abandoned console",
    cluster: "Pacific",
    hidden: true,
    story:
      "No installation should be here. A message in the buffer reads: the quiet ones are still listening.",
  },
];
export const links = [
  ["aurora", "pulse"],
  ["pulse", "nexus"],
  ["pulse", "vega"],
  ["nexus", "atlas"],
  ["nexus", "spectre"],
  ["spectre", "kestrel"],
  ["kestrel", "delta"],
  ["atlas", "echo"],
  ["atlas", "cipher"],
  ["echo", "vega"],
  ["cipher", "mirage"],
  ["mirage", "helix"],
  ["mirage", "delta"],
  ["helix", "orion"],
  ["orion", "vega"],
  ["orion", "zenith"],
  ["zenith", "delta"],
  ["atlas", "ghost"],
  ["ghost", "echo"],
  ["null", "pulse"],
  ["null", "zenith"],
];
export const signals = [
  {
    freq: 145.8,
    id: "ghost-carrier",
    name: "Unknown carrier",
    station: "echo",
    message:
      "A repeating carrier below the polar noise. Phase offset: 3. Align the waveform to recover the coordinates.",
    puzzle: "wave",
    badge: "UNIDENTIFIED",
  },
  {
    freq: 137.5,
    id: "argos-downlink",
    name: "ARGOS last transmission",
    station: "vega",
    message:
      "Four fragments from the lost satellite. Put its final instruction back in order.",
    puzzle: "fragments",
    badge: "ORBITAL",
  },
  {
    freq: 462.3,
    id: "helix-diagnostic",
    name: "Backbone diagnostic",
    station: "helix",
    message:
      "HELIX reports CARRIER L_ST. Restore the missing letter using the diagnostic report.",
    puzzle: "restore",
    badge: "MAINTENANCE",
  },
  {
    freq: 89.4,
    id: "polar-id",
    name: "Station ident",
    station: "echo",
    message:
      "78.22° N. Polar night. The northernmost listening post. Match this transmission to its source.",
    puzzle: "match",
    badge: "BEACON",
  },
  {
    freq: 108.0,
    id: "quiet-channel",
    name: "The quiet channel",
    station: "null",
    message:
      "...the quiet ones are still listening. The console accepts a single word: aquarium.",
    puzzle: null,
    badge: "UNLISTED",
  },
  {
    freq: 225.0,
    id: "lullaby",
    name: "Lullaby for a machine",
    station: "zenith",
    message:
      "Three descending notes. Someone is still at the other end. Archive recording 023 is now available.",
    puzzle: null,
    badge: "RECORDING",
  },
];
export type Archive = {
  id: string;
  name: string;
  folder: string;
  type: string;
  station: string;
  size: string;
  body: string;
  requires?: string;
  unlock?: string;
};
export const archives: Archive[] = [
  {
    id: "001",
    name: "Operator field guide",
    folder: "Briefings",
    type: "TXT",
    station: "atlas",
    size: "2.4 KB",
    body: "PHANTOM / OPERATOR HANDBOOK\n\nAll stations, telemetry, transmissions and incidents in this environment are simulated.\n\nBegin with a sector scan. Open the Signal Lab and tune to 145.8 MHz. The waveform has slipped three phase units; alignment will recover a coordinate pair. Follow those coordinates, trace the new relay, and read what it kept.\n\nTerminal shortcuts: scan sector-7 · inspect atlas · trace atlas echo · open archive.\n\nThe archive remembers what you discover, even when the timeline runs backwards.",
  },
  {
    id: "002",
    name: "ATLAS / relay dossier",
    folder: "Stations",
    type: "TXT",
    station: "atlas",
    size: "1.8 KB",
    body: "STN-001 / REYKJAVÍK\nPRIMARY ATLANTIC RELAY\n\nCarrier nominal. Two confirmed uplinks: CIPHER and ECHO. NEXUS carries westbound traffic. A fourth socket remains physically connected but absent from the station register.\n\nThe unidentified cable points northwest. Last label recovered: G—OST.\n\nRecommended action: tune the receiver to 145.8 MHz.",
  },
  {
    id: "003",
    name: "Unknown carrier / 145.8",
    folder: "Transmissions",
    type: "LOG",
    station: "echo",
    size: "3.1 KB",
    requires: "signal:145.8",
    body: "ECHO BUFFER / FRAME 007\n\nA voice, nearly below the noise: “We never stopped transmitting. You stopped listening.”\n\nThe carrier is phase-shifted by three units. MIRAGE calibration confirms phase 3. Align the signal in the Decryption Lab to recover coordinates.\n\nRepeated field: 70.12 / -35.80.",
  },
  {
    id: "004",
    name: "The station that was erased",
    folder: "Classified",
    type: "TXT",
    station: "ghost",
    size: "4.6 KB",
    requires: "puzzle:wave",
    unlock: "archive:ghost",
    body: "PROJECT GHOST / DECLASSIFIED\n\nGHOST is not an intruder. It is an archival relay built to preserve the final transmissions of stations marked for retirement. The station register was shortened. The receiver was never switched off.\n\nIts coordinates: 70.12° N, 35.80° W.\n\nTrace ATLAS → GHOST to verify the connection. Then open The first operator. There is a fifth voice in the recording.",
  },
  {
    id: "005",
    name: "ARGOS / interrupted downlink",
    folder: "Transmissions",
    type: "LOG",
    station: "vega",
    size: "2.7 KB",
    body: "VEGA ORBITAL DESK\n\nARGOS went quiet during a routine handoff. The satellite is still responding at 137.5 MHz, but its instruction has been split into four fragments.\n\nRecovered fragments: VIA / RESTORE / ATLAS / LINK.\n\nAfter reconstructing the instruction, trace ATLAS → VEGA and restore VEGA from the station inspector.",
  },
  {
    id: "006",
    name: "Recovered orbital coordinates",
    folder: "Classified",
    type: "DAT",
    station: "vega",
    size: "1.1 KB",
    requires: "puzzle:fragments",
    body: "ARGOS STATE VECTOR / RESTORED\n\nInstruction: RESTORE LINK VIA ATLAS\n\nThe route is ATLAS → ECHO → VEGA. This path avoids the interrupted equatorial uplink. Establish a trace, then authorize relay restoration at VEGA.\n\nThe satellite is carrying an archive, not a payload.",
  },
  {
    id: "007",
    name: "HELIX / failure cascade",
    folder: "Briefings",
    type: "TXT",
    station: "helix",
    size: "3.9 KB",
    body: "INCIDENT BLACKOUT\n\nHELIX drops its carrier at simulation +60 s. ORION follows at +120 s; the failure propagates east. DELTA remains a viable bypass.\n\nScan sector-7. Tune 462.3 MHz. The missing word is LOST; the corrupted letter is O. Restore the diagnostic, trace CIPHER → HELIX, then restart HELIX and ORION in that order.\n\nRewind the timeline to inspect the cascade. Restarts are timestamped; discoveries persist across replay.",
  },
  {
    id: "008",
    name: "Backbone recovery protocol",
    folder: "Classified",
    type: "TXT",
    station: "helix",
    size: "2.2 KB",
    requires: "puzzle:restore",
    body: "CONTROLLED RECOVERY\n\nDiagnostic repaired: CARRIER LOST.\n\nTrace CIPHER → HELIX to verify the intact segment. Restart HELIX first. Its carrier can then energize ORION. A successful recovery should restore both stations and normalize the availability instrument.",
  },
  {
    id: "009",
    name: "ECHO / polar ident",
    folder: "Stations",
    type: "TXT",
    station: "echo",
    size: "1.6 KB",
    body: "STN-002 / 78.22° N, 15.63° E\n\nThis is the northernmost listening post. Its station ident repeats on 89.4 MHz. Match the transmission to ECHO to recover the polar listening log.",
  },
  {
    id: "010",
    name: "Polar listening log",
    folder: "Transmissions",
    type: "LOG",
    station: "echo",
    size: "5.8 KB",
    requires: "puzzle:match",
    body: "NIGHT 182\n\nThe receiver heard our own call sign before we transmitted it. There was no measurable delay, only an eleven-minute lead.\n\nZENITH has a matching recording at 225.0 MHz. Neither operator has been told about the other.",
  },
  {
    id: "011",
    name: "MIRAGE / calibration table",
    folder: "Stations",
    type: "DAT",
    station: "mirage",
    size: "0.8 KB",
    body: "REFERENCE CARRIER\n\nFrequency: 145.8 MHz\nPhase: 3\nAmplitude: 0.72\nConfidence: stable\n\nUse phase 3 in the waveform alignment puzzle. The second wave should sit exactly over the first.",
  },
  {
    id: "012",
    name: "Atlantic topology",
    folder: "Network",
    type: "MAP",
    station: "atlas",
    size: "2.0 KB",
    body: "ATLANTIC BACKBONE\n\nNEXUS ── ATLAS ── ECHO ── VEGA\n           │        │\n         CIPHER   [GHOST]\n           │\n         MIRAGE ── HELIX ── ORION\n           │                 │\n         DELTA ────────── ZENITH\n\nBrackets identify an unlisted relay. Establish its location by decoding the unknown carrier.",
  },
  {
    id: "013",
    name: "Pacific handoff graph",
    folder: "Network",
    type: "MAP",
    station: "orion",
    size: "1.9 KB",
    body: "EASTERN ARC\n\nPULSE ────────── VEGA\n                   │\nHELIX ────────── ORION ── ZENITH\n\nA dormant link exists between ZENITH and an unregistered console in the central Pacific. The quiet channel is 108.0 MHz.",
  },
  {
    id: "014",
    name: "SPECTRE / final shift",
    folder: "Stations",
    type: "TXT",
    station: "spectre",
    size: "1.3 KB",
    unlock: "secret:console",
    body: "SHIFT HANDOVER / UNFILED\n\nI left the console on. Nobody asked me to turn it off.\n\nIf the terminal feels too quiet, type “aquarium”. The little things kept us company through the night.\n\nThe abandoned console at NULL listens on 108.0 MHz. Please tell it we are alright.",
  },
  {
    id: "015",
    name: "The first operator",
    folder: "Classified",
    type: "LOG",
    station: "ghost",
    size: "6.4 KB",
    requires: "trace:atlas:ghost",
    unlock: "secret:transmission",
    body: "ARCHIVE ZERO\n\nThere were four operators at the first test. The recording contains five voices.\n\nThe fifth says only: “Every system needs a way to remember.”\n\nIn the margin, the first operator wrote a command: theme phosphor. It switches the display to the original amber workstation.",
  },
  {
    id: "016",
    name: "NEXUS / exchange manifest",
    folder: "Stations",
    type: "DAT",
    station: "nexus",
    size: "1.7 KB",
    body: "WESTERN EXCHANGE\n\nNEXUS forwards traffic between PULSE, ATLAS and SPECTRE. Heartbeats are emitted every seven simulation seconds. Payload classes: telemetry, relay, diagnostic, archive.\n\nUse the Data Stream to inspect a packet. Selecting it highlights its route across the map.",
  },
  {
    id: "017",
    name: "PULSE / packet study",
    folder: "Network",
    type: "TXT",
    station: "pulse",
    size: "2.3 KB",
    body: "PACKET OBSERVATORY\n\nTraffic follows the shared simulation clock. Pause the timeline to freeze the network, or pause just the stream to examine a captured interval.\n\nA packet’s route is a real path through the simulated topology. Latency depends on hops and the carrier state at its timestamp.",
  },
  {
    id: "018",
    name: "AURORA / field notes",
    folder: "Stations",
    type: "TXT",
    station: "aurora",
    size: "1.4 KB",
    body: "MAGNETOSPHERE WATCH\n\nThe pattern under the solar noise repeats at exactly 145.8 MHz. It is too regular to be weather.\n\nECHO has the clearest reception. The ATLAS archive will tell you what the map forgot.",
  },
  {
    id: "019",
    name: "KESTREL / emergency route",
    folder: "Stations",
    type: "TXT",
    station: "kestrel",
    size: "1.1 KB",
    body: "SOUTHERN CONTINGENCY\n\nSPECTRE → KESTREL → DELTA remains the shortest southern route. A silent station is still addressable for diagnosis, but packets through it carry an interruption warning.",
  },
  {
    id: "020",
    name: "DELTA / maintenance ledger",
    folder: "Stations",
    type: "TXT",
    station: "delta",
    size: "1.2 KB",
    body: "MAINTENANCE LEDGER\n\nThe southern repeater has no open faults. Its bypass was designed for a simultaneous failure at HELIX and ORION.\n\nThe blackout recovery protocol is stored behind the HELIX diagnostic key.",
  },
  {
    id: "021",
    name: "ZENITH / delayed arrival",
    folder: "Stations",
    type: "LOG",
    station: "zenith",
    size: "3.3 KB",
    body: "RECEIVER NOTE\n\nThree tones arrived eleven minutes before their expected timestamp. A fragment of music followed. We filed it as Lullaby for a machine.\n\nTune 225.0 MHz to retrieve the recording. Audio is optional; the full transcript is preserved.",
  },
  {
    id: "022",
    name: "NULL / console buffer",
    folder: "Classified",
    type: "TXT",
    station: "null",
    size: "0.6 KB",
    requires: "signal:108",
    unlock: "secret:null",
    body: "NO REGISTERED OPERATOR\n\n> ping\n< still here\n> who are you\n< a place for the messages nobody collected\n\nThe abandoned console is now visible on the map. Type aquarium to restore its screensaver.",
  },
  {
    id: "023",
    name: "Lullaby for a machine",
    folder: "Recordings",
    type: "AUDIO",
    station: "zenith",
    size: "00:08",
    requires: "signal:225",
    body: "RECONSTRUCTED TRANSMISSION / 8 SECONDS\n\n[Three soft tones descend. A low carrier remains.]\n\n“Leave a light on at the station. Someone is always finding their way home.”\n\nAudio is a synthesized fictional reconstruction. The transcript contains the complete clue.",
  },
  {
    id: "024",
    name: "Session / discovery index",
    folder: "Briefings",
    type: "TXT",
    station: "atlas",
    size: "1.5 KB",
    body: "EXPLORATION INDEX\n\nSix carriers are recoverable: 89.4, 108.0, 137.5, 145.8, 225.0 and 462.3 MHz.\n\nFour keys are earned in the Decryption Lab: waveform alignment, fragment order, corrupted text, and station matching.\n\nFive secrets remain in the system: the abandoned console, the aquarium, an archived voice, NULL station, and the original display theme. Files 014, 015 and 022 contain the clues.",
  },
];
export const scenarios = [
  {
    id: "free",
    name: "Free exploration",
    code: "EXP-00",
    description:
      "Follow a signal. Trace a connection. See what the network remembers.",
    steps: [],
  },
  {
    id: "ghost-signal",
    name: "Ghost Signal",
    code: "OP-07",
    description:
      "ECHO is receiving a transmission from outside the station register. Find the carrier and discover who is still listening.",
    steps: [
      ["scan", "Scan sector-7"],
      ["signal:145.8", "Tune to 145.8 MHz"],
      ["puzzle:wave", "Align the carrier waveform"],
      ["trace:atlas:ghost", "Trace ATLAS → GHOST"],
      ["file:004", "Read the recovered archive"],
    ],
  },
  {
    id: "lost-satellite",
    name: "Lost Satellite",
    code: "OP-12",
    description:
      "ARGOS disappeared during an orbital handoff. Reassemble its last transmission and bring the relay home.",
    steps: [
      ["inspect:vega", "Inspect VEGA"],
      ["signal:137.5", "Tune to 137.5 MHz"],
      ["puzzle:fragments", "Reassemble the transmission"],
      ["trace:atlas:vega", "Trace ATLAS → VEGA"],
      ["restore:vega", "Restore the orbital relay"],
    ],
  },
  {
    id: "network-blackout",
    name: "Network Blackout",
    code: "OP-19",
    description:
      "A carrier failure at HELIX is spreading east. Recover the diagnostic key and restart the backbone in sequence.",
    steps: [
      ["scan", "Scan the affected sector"],
      ["signal:462.3", "Tune to 462.3 MHz"],
      ["puzzle:restore", "Repair the diagnostic"],
      ["trace:cipher:helix", "Trace CIPHER → HELIX"],
      ["restore:helix", "Restart HELIX"],
      ["restore:orion", "Restore ORION"],
    ],
  },
];
export const destinations = [
  {
    id: "eyes",
    name: "NASA’s Eyes",
    domain: "science.nasa.gov",
    url: "https://science.nasa.gov/eyes/",
    category: "Space",
    description:
      "Explore Earth, the solar system, and spacecraft through NASA’s interactive visualizations.",
  },
  {
    id: "nasa",
    name: "NASA Science",
    domain: "science.nasa.gov",
    url: "https://science.nasa.gov/",
    category: "Space",
    description:
      "Discover missions, planetary science, and the universe through NASA’s science resources.",
  },
  {
    id: "cern",
    name: "CERN",
    domain: "home.cern",
    url: "https://home.cern/",
    category: "Technology",
    description:
      "Explore particle physics and research at the European laboratory.",
  },
  {
    id: "arts",
    name: "Google Arts & Culture",
    domain: "artsandculture.google.com",
    url: "https://artsandculture.google.com/",
    category: "Art",
    description:
      "Explore artworks, cultural collections, and stories from institutions around the world.",
  },
  {
    id: "radio",
    name: "Radio Garden",
    domain: "radio.garden",
    url: "https://radio.garden/",
    category: "Interactive",
    description:
      "Rotate a globe to explore live radio stations around the world.",
  },
  {
    id: "ncase",
    name: "Nicky Case",
    domain: "ncase.me",
    url: "https://ncase.me/",
    category: "Interactive",
    description:
      "Playable explanations and interactive experiments about systems and human behavior.",
  },
  {
    id: "exploratorium",
    name: "Exploratorium",
    domain: "exploratorium.edu",
    url: "https://www.exploratorium.edu/",
    category: "Education",
    description:
      "Investigate science, art, and perception with a museum devoted to curiosity.",
  },
  {
    id: "pudding",
    name: "The Pudding",
    domain: "pudding.cool",
    url: "https://pudding.cool/",
    category: "Art",
    description:
      "Visual essays that use data and interactive graphics to explain culture.",
  },
];
export const byId = (id: string) => stations.find((s) => s.id === id)!;
export const neighbors = (id: string) =>
  links.filter((l) => l.includes(id)).map((l) => (l[0] === id ? l[1] : l[0]));
export function routeBetween(
  from: string,
  to: string,
  visible = stations.map((s) => s.id),
) {
  const q = [[from]];
  const seen = new Set<string>();
  while (q.length) {
    const r = q.shift()!;
    const n = r.at(-1)!;
    if (n === to) return r;
    if (seen.has(n)) continue;
    seen.add(n);
    for (const next of neighbors(n))
      if (visible.includes(next) && !seen.has(next)) q.push([...r, next]);
  }
  return [];
}
