import { VapiClient } from '@vapi-ai/server-sdk';

export function createVapiClient(apiKey: string): VapiClient {
  return new VapiClient({ token: apiKey });
}
