export interface revoltClientOptions {
  email: string;
  password: string;
}

export interface revoltConfiguration {
  ws: string;
  app: string;
}

export interface makeRequestOptions {
  method: "GET" | "POST";
  auth?: boolean;
  url: string;
  body?: any;
}

export interface sessionLoginResponse {
  result: "Success";
  _id: string;
  user_id: string;
  token: string;
  name: string | undefined | null;
}

export interface Message {
  content: "Success";
  channel: string;
  author: string;
  _id: string;
}

export type CachePostRequestBody =
  | { type: "Ready"; data: readyData }
  | { type: "ChannelCreate"; data: channelData }
  | { type: "ChannelDelete"; data: partialChannelData }
  | { type: "Message"; data: "enum" }
  | { type: "Unknown"; data: unknown };

interface partialChannelData {
  channelId: string;
}

export interface channelData extends partialChannelData {
  channelName: string;
  serverId: string;
}

type readyData = Array<channelData>;

export interface configTyping {
  messages: {
    [serverId: string]: string;
  };
  "ticket-servers": Array<string>;
  timers: Array<timer>;
}

type timer = { serverId: string; delayInSeconds: number };
