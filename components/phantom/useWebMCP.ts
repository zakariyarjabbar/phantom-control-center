"use client";
import { useEffect, type RefObject } from "react";
import { flushSync } from "react-dom";
import {
  type State,
  type Action,
  type Tool,
  visibleStations,
  telemetry,
  statusAt,
} from "./model";

type ModelContext = {
  registerTool(
    tool: {
      name: string;
      title: string;
      description: string;
      inputSchema: object;
      annotations: { readOnlyHint: boolean; untrustedContentHint: boolean };
      execute(input: unknown): unknown;
    },
    options: { signal: AbortSignal },
  ): void | Promise<void>;
};
export function useWebMCP(
  state: RefObject<State>,
  dispatch: (action: Action) => void,
  open: (tool: Tool) => void,
) {
  useEffect(() => {
    const context = (document as Document & { modelContext?: ModelContext })
      .modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    const tools: Tool[] = [
      "signals",
      "archive",
      "decrypt",
      "stream",
      "scenarios",
      "portal",
      "settings",
      "secrets",
    ];
    const read = () => ({
      time: state.current.time,
      playing: state.current.playing,
      scenario: state.current.scenario,
      selected: state.current.selected,
      frequency: state.current.freq,
      telemetry: telemetry(state.current),
      stations: visibleStations(state.current).map((x) => ({
        id: x.id,
        name: x.name,
        status: statusAt(state.current, x.id),
      })),
      discoveries: state.current.discoveries,
    });
    const register = (tool: Parameters<ModelContext["registerTool"]>[0]) => {
      try {
        void Promise.resolve(
          context.registerTool(tool, { signal: lifecycle.signal }),
        ).catch(() => {});
      } catch {
        /* Ordinary browsers continue without WebMCP. */
      }
    };
    register({
      name: "read_phantom_state",
      title: "Read PHANTOM simulation",
      description:
        "Read the current local fictional network state, discovered stations, and telemetry.",
      inputSchema: {
        type: "object",
        properties: {},
        additionalProperties: false,
      },
      annotations: { readOnlyHint: true, untrustedContentHint: false },
      execute: read,
    });
    register({
      name: "control_phantom_instrument",
      title: "Control a PHANTOM instrument",
      description:
        "Operate the same simulated scan, tune, inspection, route tracing, or instrument navigation controls as the visible UI. These actions update this device’s fictional session; no external networks are scanned.",
      inputSchema: {
        type: "object",
        properties: {
          action: {
            type: "string",
            enum: ["scan", "tune", "inspect", "trace", "open"],
          },
          frequency: { type: "number", minimum: 80, maximum: 500 },
          station: { type: "string" },
          from: { type: "string" },
          to: { type: "string" },
          tool: { type: "string", enum: tools },
        },
        required: ["action"],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: false, untrustedContentHint: false },
      execute(input: unknown) {
        if (!input || typeof input !== "object")
          throw new Error("Provide an instrument action.");
        const args = input as Record<string, unknown>;
        const known = (id: unknown): id is string =>
          typeof id === "string" &&
          visibleStations(state.current).some((x) => x.id === id);
        let action: Action | null = null;
        switch (args.action) {
          case "scan":
            action = { type: "scan" };
            break;
          case "tune":
            if (
              typeof args.frequency !== "number" ||
              !Number.isFinite(args.frequency) ||
              args.frequency < 80 ||
              args.frequency > 500
            )
              throw new Error("Frequency must be 80–500 MHz.");
            action = { type: "tune", freq: args.frequency };
            break;
          case "inspect":
            if (!known(args.station))
              throw new Error("Choose a discovered station.");
            action = { type: "inspect", id: args.station };
            break;
          case "trace":
            if (!known(args.from) || !known(args.to) || args.from === args.to)
              throw new Error("Choose two different discovered stations.");
            action = { type: "trace", from: args.from, to: args.to };
            break;
          case "open":
            if (!tools.includes(args.tool as Tool))
              throw new Error("Choose a listed instrument.");
            break;
          default:
            throw new Error("Unknown instrument action.");
        }
        flushSync(() => {
          if (action) dispatch(action);
          else open(args.tool as Tool);
        });
        return { accepted: args.action, ...read() };
      },
    });
    return () => lifecycle.abort();
  }, [state, dispatch, open]);
}
