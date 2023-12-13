import { VboutClient } from './client';

export function makeClient(apiKey: string): VboutClient {
  return new VboutClient(apiKey);
}

export const vboutCommon = {
  baseUrl: 'https://api.vbout.com/1',
};
