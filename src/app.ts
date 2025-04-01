import express, { Request } from "express";
import revoltClient from "./client/client.js";
import { CachePostRequestBody, configTyping, Message } from "./utils/typing.js";
import { sendMessage } from "./utils/message.js";
import config from "./../config.json" with { type: "json" };

const typedConfig = config as configTyping;
const { PORT = 3000 } = process.env;

const app = express();

const client = new revoltClient({
  email: process.env.REVOLT_EMAIL,
  password: process.env.REVOLT_PASSWORD,
});

await client.login();

app.use(express.json());

app.use((_, res, next) => {
  // Make sure everyone can access and get response for GET/POST requests
  res.append("Access-Control-Allow-Origin", "*");
  res.append("Access-Control-Allow-Headers", "content-type");

  // If require cookie, then might need to change * to actual origin
  next();
});

app.get("/api/ws", async (req: Request<{}, { ws: string }>, res) => {
  const config = await client.fetchConfiguration();
  res.json({
    ws: config.ws,
  });
});

app.get("/api/revolt-session", (req: Request<{}, { session: string }>, res) => {
  if (!client.token) throw new Error("Not logged in");
  res.json({
    session: client.token,
  });
});

app.post(
  "/api/cache",
  (req: Request<{}, { status: "success" }, CachePostRequestBody>, res) => {
    const { body } = req;

    if (body.type === "Ready") {
      console.log("Received ready data");

      client.channels = body.data;
    }

    if (body.type === "ChannelCreate") {
      console.log("Received channel create!");

      console.log(body.data);

      client.channels.push(body.data);
    }

    if (body.type === "ChannelDelete") {
      console.log("Received channel delete!");

      console.log(body.data);

      const i = client.channels.findIndex(
        (c) => c.channelId === body.data.channelId
      );

      if (i !== -1) client.channels.splice(i, 1);
      else console.log("Seems like channel was not found in cache!");
    }

    res.json({
      status: "success",
    });

    console.log(client.channels);
  }
);

app.post(
  "/api/message",
  async (req: Request<{}, { status: "success" }, Message>, res) => {
    const { body } = req;

    const channel = client.channels.find((c) => c.channelId === body.channel);

    if (!channel) {
      console.log("Message came but channel not found in cache!!!");
    }

    if (channel) {
      const timer = typedConfig.timers.find(
        (t) => t.serverId === channel.serverId
      );

      if (timer)
        setTimeout(async () => {
          sendMessage(client, channel);
        }, 1000 * timer.delayInSeconds);

      if (!timer) await sendMessage(client, channel);
    }

    res.json({
      status: "success",
    });
  }
);

app.listen(PORT, () => {
  console.log(`App listening on http://localhost:${PORT}`);
});
