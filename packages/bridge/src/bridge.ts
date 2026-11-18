import type { IncomingMessage } from "node:http";
import type { Duplex } from "node:stream";
import mqtt from "mqtt";
import { WebSocketServer, WebSocket } from "ws";
import type { LockEvent, LockState, ServerMessage } from "@jelic/shared";
import { config, topics } from "./config";
import { parseEvent, parseState } from "./parse";

export interface Bridge {
  /** Call from an http server's "upgrade" event for the /ws path. */
  handleUpgrade(req: IncomingMessage, socket: Duplex, head: Buffer): void;
  health(): { ok: true; broker: boolean; state: LockState | null };
  close(): void;
}

/** MQTT -> WebSocket fan-out. Keeps last state + recent events in memory (run a single instance). */
export function createBridge(): Bridge {
  let state: LockState | null = null;
  let brokerUp = false;
  const events: LockEvent[] = [];

  const wss = new WebSocketServer({ noServer: true });
  const send = (ws: WebSocket, msg: ServerMessage) => {
    if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(msg));
  };
  const broadcast = (msg: ServerMessage) => wss.clients.forEach((c) => send(c, msg));

  wss.on("connection", (ws) => send(ws, { kind: "snapshot", state, events, broker: brokerUp }));

  const client = mqtt.connect(config.mqttUrl, {
    username: config.mqttUsername,
    password: config.mqttPassword,
    reconnectPeriod: 3000,
  });

  client.on("connect", () => {
    brokerUp = true;
    console.log(`[mqtt] connected to ${config.mqttUrl}`);
    client.subscribe([topics.events, topics.state], { qos: 1 });
    broadcast({ kind: "broker", connected: true });
  });
  client.on("close", () => {
    brokerUp = false;
    broadcast({ kind: "broker", connected: false });
  });
  client.on("error", (e) => console.error("[mqtt]", e.message));

  client.on("message", (topic, buf) => {
    const payload = buf.toString();
    const ts = Date.now();
    if (topic === topics.state) {
      const s = parseState(payload);
      if (!s) return console.warn("[mqtt] bad state payload:", payload);
      state = s;
      broadcast({ kind: "state", state: s, ts });
    } else if (topic === topics.events) {
      const type = parseEvent(payload);
      if (!type) return console.warn("[mqtt] bad event payload:", payload);
      const event: LockEvent = { type, ts };
      events.push(event);
      if (events.length > config.historyLimit) events.shift();
      broadcast({ kind: "event", event });
    }
  });

  return {
    handleUpgrade: (req, socket, head) =>
      wss.handleUpgrade(req, socket, head, (ws) => wss.emit("connection", ws, req)),
    health: () => ({ ok: true, broker: brokerUp, state }),
    close: () => {
      client.end(true);
      wss.close();
    },
  };
}
