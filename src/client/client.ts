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

    const curlImpersonate = new CurlImpersonate(
      `${this.revoltApiBaseUrl}${options.url}`,
      {
        method: options.method,
        impersonate: "chrome-116",
        headers: requestOptions.headers,
        body: options.body,
      }
    );

    // perform the request
    const curlResponse = await curlImpersonate.makeRequest();

    // extract the response data
    const response = curlResponse.response;
    const responseStatusCode = curlResponse.statusCode;

    // if the server responded with a 4xx or 5xx error
    if (
      responseStatusCode &&
      ["4", "5"].includes(responseStatusCode.toString()[0])
    ) {
      console.log(curlResponse);
      //   console.log(await res.json());
      throw new Error(response);
    }
    return JSON.parse(response);
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
