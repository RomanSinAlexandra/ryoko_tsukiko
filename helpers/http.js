import axios from "axios";

export async function httpGet(url, headers = {}) {
  try {
    const res = await axios.get(url, {
      headers,
      timeout: 10_000
    });

    return res.data;
  } catch (err) {
    throw {
      message: err.message,
      status: err.response?.status,
      data: err.response?.data
    };
  }
}
