export type LockState = "open" | "closed";
export type EventType = "tampering" | "person_detected";

export interface LockEvent {
  type: EventType;
  ts: number;
}

/** Messages sent from backend to web over WebSocket. */
export type ServerMessage =
  | { kind: "snapshot"; state: LockState | null; events: LockEvent[]; broker: boolean }
  | { kind: "event"; event: LockEvent }
  | { kind: "state"; state: LockState; ts: number }
  | { kind: "broker"; connected: boolean };
