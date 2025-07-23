const { default: CurlImpersonate } = require("node-curl-impersonate");

async function fetchAPI(params) {
  const headers = {
    //   accept: "application/json, text/plain, */*",
    //   "accept-language": "en-US,en;q=0.9,fr;q=0.8",
    //   "cache-control": "no-cache",
    //   pragma: "no-cache",
    //   priority: "u=1, i",
    referer: "https://revolt.onech.at/",
    //   "sec-ch-ua":
    //     '"Not)A;Brand";v="8", "Chromium";v="138", "Microsoft Edge";v="138"',
    //   "sec-ch-ua-mobile": "?0",
    //   "sec-ch-ua-platform": '"Windows"',
    //   "sec-fetch-dest": "empty",
    //   "sec-fetch-mode": "cors",
    //   "sec-fetch-site": "same-site",
    "user-agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0",
  };
  const curlImpersonate = new CurlImpersonate("https://revolt-api.onech.at/", {
    method: "GET",
    impersonate: "chrome-116",
    headers,
  });

  // perform the request
  const curlResponse = await curlImpersonate.makeRequest();
  console.log(curlResponse);
}

fetchAPI();
