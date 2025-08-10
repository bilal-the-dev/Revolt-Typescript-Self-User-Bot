// Import puppeteer
// const puppeteer = require( "puppeteer")
import { setTimeout } from "node:timers/promises";
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

  await page.goto("https://revolt.onech.at/", { waitUntil: "networkidle2" });

  await page.screenshot({ path: "app.png" });

  const three = await page.evaluate(
    async (token, CONFIG) => {
      const REVOLT_API_BASE_URL = "https://revolt-api.onech.at";
      const cacheStore = [];
      const alphabet = "abcdefghijklmnopqrstuvwxyz";

      await window.logFromPage("Establishing socket!");

      const ws = new WebSocket(`wss://revolt-ws.onech.at?token=${token}`);

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
          }

          if (json.type === "ChannelCreate") {
            console.log("Channel created!");

            if (json.channel_type !== "TextChannel") return;

            //  check if ticket then spam!!!

            if (!CONFIG["ticket-servers"].includes(json.server)) return;
            if (!json.name.startsWith("ticket-")) return;

            const amount = new Array(CONFIG.messages_to_spam);

            for (const a of amount) {
              await sendMessage(json);
              if (CONFIG.delay_between_spam_messages_in_second)
                await setTimeout(
                  CONFIG.delay_between_spam_messages_in_second * 1000
                );
            }
          }
        } catch (error) {
          console.log(error);
        }

        async function sendMessage(channel) {
          try {
            const messageToSend = "/claim";

            await fetch(
              `${REVOLT_API_BASE_URL}/channels/${channel._id}/messages`,
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
