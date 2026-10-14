import { HttpMethod, httpClient } from "@activepieces/pieces-common";
import type { BirdHttpClient } from "./types";

export const birdHttpClient: BirdHttpClient = {
  async sendRequest(request) {
    const method = Object.values(HttpMethod).find(
      (value) => value === request.method,
    );
    if (!method)
      throw new Error("The Bird action contains an invalid HTTP method.");
    return httpClient.sendRequest<unknown>({ ...request, method });
  },
};
