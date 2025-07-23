import { RequestBuilder } from "ts-curl-impersonate";
import {
  channelData,
  makeRequestOptions,
  revoltClientOptions,
  revoltConfiguration,
  sessionLoginResponse,
} from "../utils/typing.js";
import CurlImpersonate from "node-curl-impersonate";

export default class revoltClient {
  revoltApiBaseUrl: string = process.env.REVOLT_API_BASE_URL;
  #email: string | undefined;
  #password: string | undefined;
  #configuration: revoltConfiguration | undefined;
  #session: sessionLoginResponse | undefined;
  #token: string | undefined;

  channels: Array<channelData> = [];

  constructor(options: revoltClientOptions) {
    if (!options.email || !options.password)
      throw new Error("Please provide email and password for revolt!");

    this.#email = options.email;
    this.#password = options.password;
  }

  get token() {
    return this.#token;
  }

  async makeRequest(options: makeRequestOptions) {
    console.log(`Making API request for ${options.url} (${options.method})`);

    if (options.auth && !this.#session)
      throw new Error("Have not logged in yet!");

    const requestOptions: RequestInit = { method: options.method };

    if (options.body) requestOptions.body = JSON.stringify(options.body);

    requestOptions.headers = {
      "X-Session-Token": this.#token!,
      referer: "https://revolt.onech.at/",
      "user-agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0",
    };

    const req = new RequestBuilder()
      .url(`${this.revoltApiBaseUrl}${options.url}`)
      .preset({ name: "chrome", version: "110" })
      .method(options.method)
      .headers(requestOptions.headers);

    if (options.body) req.body(options.body);

    const response = await req.send();

    console.log(response);

    if (response.stderr) throw new Error(response.stderr);
    return JSON.parse(response.response!);
    // const res = await fetch(
    //   `${this.revoltApiBaseUrl}${options.url}`,
    //   requestOptions
    // );

    // if (!res.ok) {
    //   console.log(res);
    //   console.log(await res.json());
    //   throw new Error(res.statusText);
    // }

    // return res.json();
  }

  async fetchConfiguration(): Promise<revoltConfiguration> {
    if (this.#configuration) return this.#configuration;

    const data = (await this.makeRequest({
      url: "/",
      method: "GET",
    })) as revoltConfiguration;

    this.#configuration = data;

    return data;
  }

  async login() {
    const res = (await this.makeRequest({
      url: "/auth/session/login",
      method: "POST",
      body: { email: this.#email, password: this.#password },
    })) as sessionLoginResponse;

    console.log(res);

    this.#session = res;
    this.#token = res.token;
  }
}
