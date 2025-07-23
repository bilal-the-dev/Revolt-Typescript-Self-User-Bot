import WebSocket from "ws"; // or: const WebSocket = require('ws');

// Replace with your WebSocket server URL
const ws = new WebSocket("wss://revolt-ws.onech.at");

ws.on("open", () => {
  console.log("✅ Connected to WebSocket");
  ws.send(JSON.stringify({ type: "subscribe", channel: "ticker" }));
});

ws.on("message", (data) => {
  console.log("📨 Received:", data.toString());
});

ws.on("error", (error) => {
  console.error("❌ Error:", error);
});

ws.on("close", (code, reason) => {
  console.log(`❎ Connection closed: ${code} ${reason}`);
});
