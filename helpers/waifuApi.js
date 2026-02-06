import { httpGet } from "./http.js";

const BASE_URL = "https://waifu.it/api/v4";

export async function waifuApi(endpoint) {
  return httpGet(`${BASE_URL}${endpoint}`, {
    Authorization: `${process.env.WAIFU_IT_KEY}`,
    Accept: "application/json"
  });
}
