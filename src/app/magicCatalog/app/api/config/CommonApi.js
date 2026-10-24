import { APIURL, getHeaders } from "./config";

export const CommonAPI = async (body, { signal } = {}) => {
  try {
    const init = JSON.parse(sessionStorage.getItem("taskInit")) || {};
    const headers = getHeaders(init);

    const response = await fetch(APIURL, {
      method: 'POST',
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      signal,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    // Let cancellation propagate — callers treat it as "discard", not failure
    if (error?.name === 'AbortError') throw error;
    console.error("API Error:", error);
    return null;
  }
};
