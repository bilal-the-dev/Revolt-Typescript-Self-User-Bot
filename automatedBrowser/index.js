// Import puppeteer
// const puppeteer = require( "puppeteer")
import puppeteer from "puppeteer-extra";

// Add stealth plugin and use defaults (all tricks to hide puppeteer usage)
import StealthPlugin from "puppeteer-extra-plugin-stealth";

import config from "./../config.json" with { type: "json" };
puppeteer.use(StealthPlugin());

(async () => {
  // Launch the browser
  const browser = await puppeteer.launch({
    headless: process.env.NODE_ENV === "production",
    ...(process.platform === "linux" && {
      args: ["--no-sandbox"],
      executablePath: "/usr/bin/chromium-browser",
    }),
    devtools: true,
  });

  // Create a page
  const page = await browser.newPage();

  // Go to your site
  await page.exposeFunction("logFromPage", (msg) => {
    console.log("[Browser Log]:", msg);
  });

  await page.setRequestInterception(true);
  page.on("request", (request) => {
    const url = request.url();

    console.log(`request to: ${url}`);
    if (url.startsWith("https://revolt.onech.at/cdn-cgi")) {
      console.log(`Blocked request to: ${url}`);
      request.abort(); // block the request
    } else {
      request.continue(); // allow all other requests
    }
  });
  await page.goto("https://revolt.onech.at/", { waitUntil: "networkidle2" });

  await page.screenshot({ path: "app.png" });

  const three = await page.evaluate(
    async (token, CONFIG) => {
      const REVOLT_API_BASE_URL = "https://revolt-api.onech.at";
      const cacheStore = [];
      const alphabet = "abcdefghijklmnopqrstuvwxyz";

      await window.logFromPage("Establishing socket!");

      const ws = new WebSocket(`wss://revolt-ws.onech.at?token=${token}`);

      console.log(ws.bufferedAmount);

      ws.addEventListener("open", async (event) => {
        try {
          console.log("Connection opened!");

          await window.logFromPage("Connection opened!");

          // console.log(ws.bufferedAmount);
        } catch (error) {
          console.log(error);
        }
      });

      ws.addEventListener("message", async (event) => {
        try {
          console.log("Something received over socket");

          const json = JSON.parse(event.data);
          console.log(json);

          if (json.type === "Error") {
            console.log(event);
            console.log(event.data);
            console.log("Error occured!!!");
          }

          if (json.type === "Ready") {
            console.log(
              "Client became ready, starting to ping every 10 seconds!"
            );

            setInterval(() => {
              console.log("Pinging socket!");

              ws.send(
                JSON.stringify({
                  type: "Ping",
                  data: Date.now(),
                })
              );
            }, 1000 * 10);

            const readyData = json.channels
              .filter((c) => c.channel_type === "TextChannel")
              .map((c) => ({
                channelId: c._id,
                channelName: c.name,
                serverId: c.server,
              }));

            cacheStore.push(...readyData);

            console.log(cacheStore);
          }

          if (json.type === "ChannelCreate") {
            console.log("Channel created!");

            if (json.channel_type !== "TextChannel") return;

            cacheStore.push({
              channelId: json._id,
              channelName: json.name,
              serverId: json.server,
            });
            console.log(cacheStore);
          }

          if (json.type === "ChannelDelete") {
            console.log("Channel deleted!");

            const i = cacheStore.findIndex((c) => c.channelId === json.id);

            if (c === -1)
              return console.log(
                `Channel delete received but not found in cache ${json.id}`
              );

            cacheStore.splice(i, 1);
          }

          if (json.type === "Message") {
            console.log("Message!");

            if (
              json.content !==
              "If you'd like to close this ticket, use the `/close` command.\nIf you'd like to claim it use the `/claim` command, just know claiming can sometimes be buggy."
            )
              return;

            const channel = cacheStore.find(
              (c) => c.channelId === json.channel
            );

            if (!channel) {
              return console.log(
                "Message came but channel not found in cache!!!"
              );
            }

            if (channel) {
              const timer = CONFIG.timers.find(
                (t) => t.serverId === channel.serverId
              );

              if (timer)
                setTimeout(async () => {
                  sendMessage(channel);
                }, 1000 * timer.delayInSeconds);

              if (!timer) await sendMessage(channel);
            }
          }
        } catch (error) {
          console.log(error);
        }

        async function sendMessage(channel) {
          try {
            let messageToSend = CONFIG.messages[channel.serverId];

            if (!messageToSend) {
              if (CONFIG["ticket-servers"].includes(channel.serverId))
                messageToSend = `${channel.channelName.split("ticket-")[1]}`;
            }

            if (!messageToSend) {
              const firstRandomCharacter =
                alphabet[Math.floor(Math.random() * alphabet.length)];
              const secondRandomCharacter =
                alphabet[Math.floor(Math.random() * alphabet.length)];

              messageToSend = `${firstRandomCharacter}${secondRandomCharacter}`;
            }

            await fetch(
              `${REVOLT_API_BASE_URL}/channels/${channel.channelId}/messages`,
              {
                method: "POST",
                headers: {
                  "content-type": "application/json",
                  "X-Session-Token": token,
                },
                body: JSON.stringify({ content: messageToSend }),
              }
            );
          } catch (error) {
            console.log(error);
          }
        }
      });

      ws.addEventListener("close", async (event) => {
        console.log("Connectio closed!");

        console.log(event);
        console.log(event.code);
        console.log(event.reason);
        console.log(event.wasClean);

        await window.logFromPage("Connection closed!");
        await window.logFromPage(event);
      });

      ws.addEventListener("error", async (event) => {
        console.log("Error occured");

        await window.logFromPage("Error occured");
        await window.logFromPage(event);

        console.log(event);
      });

      return ws;
    },
    process.env.REVOLT_USER_TOKEN,
    config
  );

  console.log(three);

  // Close browser.
  //   await browser.close();
})();
