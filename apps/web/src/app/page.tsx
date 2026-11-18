"use client";
import { useLock, type Link, type LogItem } from "../lib/useLock";

const LINK_LABEL: Record<Link, string> = {
  connecting: "conectando…",
  live: "en vivo",
  "broker-down": "broker caído",
  offline: "sin servidor",
};

function Padlock({ open }: { open: boolean }) {
  return (
    <svg viewBox="0 0 64 64" width="64" height="64" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="12" y="28" width="40" height="28" rx="7" fill="currentColor" fillOpacity=".12" />
      <path d={open ? "M22 28V20a10 10 0 0 1 19-4" : "M22 28V20a10 10 0 0 1 20 0v8"} />
      <circle cx="32" cy="42" r="3" fill="currentColor" stroke="none" />
    </svg>
  );
}

function describe(i: LogItem): { title: string; tone: string } {
  if (i.kind === "state")
    return { title: i.state === "open" ? "Pestillo abierto" : "Pestillo cerrado", tone: i.state === "open" ? "warn" : "ok" };
  return i.type === "tampering"
    ? { title: "Forcejeo detectado", tone: "bad" }
    : { title: "Persona detectada", tone: "info" };
}

export default function Page() {
  const { state, link, log } = useLock();
  const tone = state === "open" ? "warn" : state === "closed" ? "ok" : "idle";
  const alerts = log.filter((l) => l.kind === "event" && l.type === "tampering").length;

  return (
    <main>
      <header>
        <h1>Jelic</h1>
        <span className={`pill ${link}`}><i />{LINK_LABEL[link]}</span>
      </header>

      <section className={`hero ${tone}`}>
        <div className="ring"><Padlock open={state === "open"} /></div>
        <strong>{state === "open" ? "Abierto" : state === "closed" ? "Cerrado" : "Sin datos"}</strong>
      </section>

      <div className="stats">
        <div><b>{log.length}</b><span>registros</span></div>
        <div className={alerts ? "danger" : ""}><b>{alerts}</b><span>forcejeos</span></div>
      </div>

      <section>
        <h2>Actividad</h2>
        {log.length === 0 ? (
          <p className="empty">Esperando eventos del dispositivo…</p>
        ) : (
          <ul>
            {log.map((i) => {
              const d = describe(i);
              return (
                <li key={i.id} className={d.tone}>
                  <i />
                  <span>{d.title}</span>
                  <time>{new Date(i.ts).toLocaleTimeString()}</time>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </main>
  );
}
