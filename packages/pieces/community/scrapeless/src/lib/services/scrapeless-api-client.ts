import { ScrapelessClient } from "@scrapeless-ai/sdk";

export function createScrapelessClient(auth: string) {
  return new ScrapelessClient({
    apiKey: auth,
    timeout: 2 * 60 * 1000,
  });
}
