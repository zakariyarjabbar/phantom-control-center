# PHANTOM visual system

PHANTOM is an operating surface for an entertainment experience, with the visual vocabulary of a cinematic specialist workstation. It opens on the map and instruments, with no marketing landing page.

## Composition

Desktop: compact status header, narrow tool rail, large geographic workspace, station inspector, and collapsible command/event area. Instrument windows float above the workspace and persist their geometry. On small screens, navigation becomes horizontal, the inspector opens on demand, and instruments fill the viewport.

The core visual moment is a selected relay with target brackets, highlighted connections, a coordinated inspector, and terminal context. Discoveries reveal hidden relays and archive content. Routine navigation stays quick.

## Palette and materials

- Ground: `#090e0c`; principal workspace: `#0d130f`.
- Instrument surface: `#0e1711`; deeper map surface: `#0a130e`.
- Primary text: `#d1dbd3`; secondary text uses muted green.
- Active phosphor: default near `#89ed73`, configurable by intensity.
- Dividers: `#243129`; narrow one-pixel technical borders.
- Amber: `#d9b16a` for unstable carriers; red: `#db7d75` for critical or destructive states.
- External destinations use blue-green accents and explicitly display their actual domain.

Corners stay tight, typically 2–4 px. Glow belongs to active map points and meaningful discoveries. Noise and scan lines are optional and noninteractive. The secret amber theme retains the same geometry and hierarchy.

## Type

Space Grotesk is the principal UI and heading family. IBM Plex Mono carries commands, telemetry, labels, coordinates, and archive content. Both are self-hosted. Values use stable numeric formatting. Archive text uses a comfortable reading measure.

## Shared controls

Included Radix/Shadcn primitives provide tabs, ranges, switches, tables, navigation, progress, inputs, notifications, and reset dialogs. Focus outlines use phosphor green. Stations have status labels as well as color. Important terminal actions have clickable alternatives.

## Motion and sound

Simulation time owns packet motion, telemetry, scans, route hops, failures, restoration timing, and globe rotation. The constellation shares station identities and allows pointer dragging and keyboard movement. A short startup can be skipped or replayed. Reduced-motion and lightweight controls hold nonessential effects. Audio requires explicit enablement. The eight-second fictional recording includes a text transcript.

## Delivery boundary

The user requested completion without further website testing. This document records the implementation; it does not claim that a final visual, browser, or accessibility review passed. Earlier local captures are working artifacts and are not included in the source repository.
