import { Letta } from '@letta-ai/letta-client';
import type { ClientOptions } from './types';
import { LettaAuthType } from './auth';


export function getLettaClient(auth: LettaAuthType): Letta {
  const clientConfig: ClientOptions = {};
  
  if (auth.apiKey) {
    clientConfig.apiKey = auth.apiKey;
  }
  
  if (auth.baseUrl) {
    clientConfig.baseURL = auth.baseUrl;
  }

  return new Letta(clientConfig);
}

