"use client";
import { useEffect, useState } from "react";
import type { LockEvent, LockState, ServerMessage } from "@jelic/shared";

export type LogItem =
  | { id: string; kind: "event"; type: LockEvent["type"]; ts: number }
  | { id: string; kind: "state"; state: LockState; ts: number };

export type Link = "connecting" | "live" | "broker-down" | "offline";

const MAX = 100;
const wsUrl = () =>
  process.env.NEXT_PUBLIC_WS_URL ||
  `${location.protocol === "https:" ? "wss" : "ws"}://${location.host}/ws`;

export function useLock() {
  const [state, setState] = useState<LockState | null>(null);
  const [link, setLink] = useState<Link>("connecting");
  const [log, setLog] = useState<LogItem[]>([]);

  useEffect(() => {
    let ws: WebSocket | undefined;
    let timer: ReturnType<typeof setTimeout>;
    let closed = false;
    let seq = 0;
    const evItem = (e: LockEvent): LogItem => ({ id: `e${seq++}`, kind: "event", type: e.type, ts: e.ts });
    const push = (i: LogItem) => setLog((l) => [i, ...l].slice(0, MAX));

    const connect = () => {
      ws = new WebSocket(wsUrl());
      ws.onmessage = (ev) => {
        const m = JSON.parse(ev.data) as ServerMessage;
        if (m.kind === "snapshot") {
          setLog([...m.events].reverse().map(evItem));
          setState(m.state);
          setLink(m.broker ? "live" : "broker-down");
        } else if (m.kind === "event") push(evItem(m.event));
        else if (m.kind === "state") {
          setState(m.state);
          push({ id: `s${seq++}`, kind: "state", state: m.state, ts: m.ts });
        } else setLink(m.connected ? "live" : "broker-down");
      };
      ws.onclose = () => {
        if (closed) return;
        setLink("offline");
        timer = setTimeout(connect, 2000);
      };
    };
    connect();
    return () => {
      closed = true;
      clearTimeout(timer);
      ws?.close();
    };
  }, []);

  return { state, link, log };
}
