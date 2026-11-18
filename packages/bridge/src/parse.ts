import type { EventType, LockState } from "@jelic/shared";

/** Accepts plain text ("open") or JSON ({"state":"open"} / {"event":"tampering"}). */
function unwrap(payload: string, key: string): string {
  const raw = payload.trim();
  if (raw.startsWith("{")) {
    try {
      const obj = JSON.parse(raw);
      return String(obj[key] ?? obj.type ?? "").trim().toLowerCase();
    } catch {
      return "";
    }
  }
  return raw.replace(/^"|"$/g, "").toLowerCase();
}

export function parseState(payload: string): LockState | null {
  const v = unwrap(payload, "state");
  return v === "open" || v === "closed" ? v : null;
}

export function parseEvent(payload: string): EventType | null {
  const v = unwrap(payload, "event");
  return v === "tampering" || v === "person_detected" ? v : null;
}
