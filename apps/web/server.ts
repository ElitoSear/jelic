// Integrated mode: Next.js + MQTT/WebSocket bridge in ONE process (run a single instance).
import { createServer } from "node:http";
import next from "next";
import { createBridge } from "@jelic/bridge";

const dev = process.env.NODE_ENV !== "production";
const port = Number(process.env.PORT ?? 3000);

const app = next({ dev, dir: import.meta.dirname });
const handle = app.getRequestHandler();
await app.prepare();
const upgradeNext = app.getUpgradeHandler();
const bridge = createBridge();

const server = createServer((req, res) => {
  if (req.url?.split("?")[0] === "/health") {
    res.setHeader("content-type", "application/json");
    return void res.end(JSON.stringify(bridge.health()));
  }
  void handle(req, res);
});
server.on("upgrade", (req, socket, head) => {
  if (req.url?.split("?")[0] === "/ws") bridge.handleUpgrade(req, socket, head);
  else void upgradeNext(req, socket, head); // keeps Next HMR working in dev
});
server.listen(port, () => console.log(`[web] http://localhost:${port} (integrated, ws at /ws)`));
