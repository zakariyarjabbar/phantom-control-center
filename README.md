# PHANTOM — Control Center

An immersive fictional command center built with React, TypeScript, and Vinext. Discover a signal, decode its coordinates, reveal a station, trace its connections, and recover an archive.

All stations, operational telemetry, packets, diagnostics, incidents, and transmissions are simulated. No command scans or controls a real network. The exploration directory is separate and links to real public websites.

## Run locally

Requires Node.js 22.13 or later and npm.

```sh
npm ci
npm run dev
```

Open `http://localhost:5173`. Fonts, geographic data, and the fictional audio recording are included. The simulation needs no account, paid service, API key, or live-data integration.

```sh
npm run build
npm start
```

The production build targets a Cloudflare-compatible Worker through the included Vinext and Sites configuration. `.openai/hosting.json` identifies the private Sites project. The GitHub repository is the primary source checkout; keep deployments private unless you deliberately change the audience.

## Explore

- **Tactical map:** pan, zoom, inspect 16 stations (14 initially visible), focus the selection, filter by state or cluster, switch to a wireframe globe or draggable constellation.
- **Signal lab:** a dial, frequency slider, direct input, waveform, spectrum, and six discoverable transmissions.
- **Decryption:** waveform alignment, ordered fragments, corrupted text restoration, and station matching, with hints and reset controls.
- **Archive:** 24 authored reports, network diagrams, transcripts, and a synthesized recording, with folders, search, sorting, previews, and discovery locks.
- **Data stream:** inspect deterministic packets, highlight their routes, pause a capture, filter by station or type, build traces, and inspect derived telemetry.
- **Scenarios:** Ghost Signal, Lost Satellite, Network Blackout, and free exploration, with connected objectives and completion states.
- **Workspace:** movable, resizable, minimizable windows; maximize and left/right snap controls; saved presets and a panel dock.
- **Timeline:** pause, play, rewind, scrub recorded history, change speed, and return to live. New world-changing actions made during replay return to the live edge. Discoveries persist.
- **Coordinates:** searchable real-site directory with favorites and a saved collection.
- **Settings:** operator identity, phosphor and brightness, glow, CRT texture, scan lines, motion, graphics mode, density, workspace, audio, and fullscreen.

Select **Investigate signal** for a guided start, or open Scenarios from the navigation rail.

## Terminal

```text
help
scan sector-7
inspect atlas
trace atlas echo
open archive
tune 145.8
scenario ghost-signal
scenario lost-satellite
scenario network-blackout
restore helix
clear
```

Use **Tab** for completion and **↑ / ↓** for command history. **⌘/Ctrl K** or the backtick key focuses the terminal. Tool shortcuts are **1** for the map and **2–7** for the major instruments. **Escape** closes the active instrument. The constellation supports arrow-key movement of focused nodes. Secrets and hidden commands are hinted at inside files and transmissions.

## State and persistence

`components/phantom/model.ts` owns simulation actions, event history, station status, routing progress, telemetry, and packet generation. All panels read from the same reducer state. Simulation time advances only while the page is visible and playback is enabled. Histories and streams are bounded.

The browser stores settings, discoveries, scenario progress, favorites, saved Coordinates, and window layout locally. There is no server-side personal-data store. Audio starts muted on each page load and requires the visitor to enable it. Settings provide separate resets for layout, preferences, and simulation progress.

The optional, feature-detected WebMCP integration exposes `read_phantom_state` and `control_phantom_instrument`. Browsers without WebMCP use the normal UI. The integration is not independently verified in a supported WebMCP browser.

## Source layout

```text
app/page.tsx                         Console shell, terminal, windows, audio, persistence
app/globals.css                      Responsive visual system
components/phantom/Map.tsx            Geographic, globe, and constellation views
components/phantom/Tools.tsx          Signal, archive, puzzle, stream, scenario, portal, settings tools
components/phantom/model.ts           Shared deterministic simulation
components/phantom/data.ts            Stations, topology, authored archives, scenarios, destinations
components/phantom/useWebMCP.ts       Optional browser agent interface
public/data/world.json               Bundled Natural Earth geography
public/fonts/                        Self-hosted display and monospaced fonts
public/audio/lullaby.wav              Authored fictional transmission
```

## Delivery status

The final implementation was completed without further website testing at the owner's request. No final browser, automated interaction, or accessibility certification is claimed. Any production compilation is for packaging, not an end-to-end verification of the experience.

See [DESIGN.md](DESIGN.md) for the visual system and [ATTRIBUTIONS.md](ATTRIBUTIONS.md) for asset sources and licenses.
