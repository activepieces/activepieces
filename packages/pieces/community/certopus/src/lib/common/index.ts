import { CertopusClient } from './client';

export function makeClient(apiKey: string): CertopusClient {
  return new CertopusClient(apiKey);
}

export const certopusCommon = {
  baseUrl: 'https://api.certopus.com/v1',
};
