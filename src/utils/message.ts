import revoltClient from "../client/client.js";
import { channelData, configTyping } from "./typing.js";
import config from "./../../config.json" with { type: "json" };

const typedConfig = config as configTyping;
const alphabet = "abcdefghijklmnopqrstuvwxyz";

export const sendMessage = async (
  client: revoltClient,
  channel: channelData
) => {
  try {
    let messageToSend = typedConfig.messages[channel.serverId];

    if (!messageToSend) {
      if (config["ticket-servers"].includes(channel.serverId))
        messageToSend = `${channel.channelName.split("ticket-")[1]}`;
    }

    if (!messageToSend) {
      const firstRandomCharacter =
        alphabet[Math.floor(Math.random() * alphabet.length)];
      const secondRandomCharacter =
        alphabet[Math.floor(Math.random() * alphabet.length)];

      messageToSend = `${firstRandomCharacter}${secondRandomCharacter}`;
    }

    await client.makeRequest({
      method: "POST",
      url: `/channels/${channel.channelId}/messages`,
      body: { content: messageToSend },
      auth: true,
    });
  } catch (error) {
    console.log(error);
  }
};
