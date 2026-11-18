function required(name: string): string {
  const v = process.env[name]?.trim();
  if (!v) {
    console.error(`[config] Missing ${name}. Copy apps/web/.env.example to apps/web/.env and fill it in.`);
    process.exit(1);
  }
  return v;
}

const prefix = required("TOPIC_PREFIX");

export const config = {
  mqttUrl: required("MQTT_URL"),
  mqttUsername: process.env.MQTT_USERNAME || undefined,
  mqttPassword: process.env.MQTT_PASSWORD || undefined,
  prefix,
  port: Number(process.env.PORT ?? 3000),
  historyLimit: 200,
};

/** ESP32 publishes: <prefix>/events (tampering|person_detected) and <prefix>/lock/state (open|closed). */
export const topics = {
  events: `${prefix}/events`,
  state: `${prefix}/lock/state`,
};
