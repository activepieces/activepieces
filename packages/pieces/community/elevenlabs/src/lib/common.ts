import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js';
import { ElevenLabsEnvironment } from '@elevenlabs/elevenlabs-js/environments';
import { AppConnectionValueForAuthProperty } from '@activepieces/pieces-framework';
import { elevenlabsAuth } from '..';

export type ElevenResidency = 'default' | 'us' | 'eu';

export interface ExtendedReadableStream<R> extends ReadableStream {
  [Symbol.asyncIterator](): AsyncIterableIterator<R>;
}



export const ELEVEN_RESIDENCY: Record<ElevenResidency, ElevenLabsEnvironment> = {
  default: ElevenLabsEnvironment.Production,
  us: ElevenLabsEnvironment.ProductionUs,
  eu: ElevenLabsEnvironment.ProductionEu,
};

// get API key with backward compatibility:
// new format is object { apiKey: '', region: '' }
// old format is a secret that is deserealised as an object
export const getApiKey = (auth: AppConnectionValueForAuthProperty<typeof elevenlabsAuth> | string): string => {
  if (typeof auth === 'string') {
    return auth;
  }
  return auth?.props.apiKey ?? Object.values(auth.props).join('');
}

export const getRegionApiUrl = (region?: ElevenResidency) => {
  return ELEVEN_RESIDENCY[region ?? 'default'].base;
}

export const createClient = (auth: AppConnectionValueForAuthProperty<typeof elevenlabsAuth>) => {
  return new ElevenLabsClient({
    apiKey: `${getApiKey(auth)}`,
    environment: ELEVEN_RESIDENCY[auth.props.region ?? 'default'],
  });
}
