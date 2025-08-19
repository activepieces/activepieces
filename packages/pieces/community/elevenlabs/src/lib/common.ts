import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js';
import { ElevenLabsEnvironment } from '@elevenlabs/elevenlabs-js/environments';

export type ElevenResidency = 'default' | 'us' | 'eu';

export interface ExtendedReadableStream<R> extends ReadableStream {
  [Symbol.asyncIterator](): AsyncIterableIterator<R>;
}

export type ElevenAuthType = {
  region?: ElevenResidency;
  apiKey?: string;
}

export const ELEVEN_RESIDENCY: Record<ElevenResidency, ElevenLabsEnvironment> = {
  default: ElevenLabsEnvironment.Production,
  us: ElevenLabsEnvironment.ProductionUs,
  eu: ElevenLabsEnvironment.ProductionEu,
};

// get API key with backward compatibility:
// new format is object { apiKey: '', region: '' }
// old format is a secret that is deserealised as an object
export const getApiKey = (auth: ElevenAuthType | string): string => {
  if (typeof auth === 'string') {
    return auth;
  }
  return auth?.apiKey ?? Object.values(auth).join('');
}

export const getRegionApiUrl = (region?: ElevenResidency) => {
  return ELEVEN_RESIDENCY[region ?? 'default'].base;
}

export const createClient = (auth: ElevenAuthType) => {
  return new ElevenLabsClient({
    apiKey: `${getApiKey(auth)}`,
    environment: ELEVEN_RESIDENCY[auth.region ?? 'default'],
  });
}
