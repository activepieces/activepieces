import { tryCatchSync } from '@activepieces/core-utils';

const ACQUISITION_PARAM_KEYS = [
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content',
  'gclid',
  'fbclid',
  'ref',
  'ap_cta',
] as const;

const STORAGE_KEY = 'ap_acquisition_params';

function stashAcquisitionParams(): void {
  const fromUrl = readFromSearch(window.location.search);
  if (Object.keys(fromUrl).length === 0) {
    return;
  }
  tryCatchSync(() => {
    if (sessionStorage.getItem(STORAGE_KEY) !== null) {
      return;
    }
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(fromUrl));
  });
}

function getAcquisitionParams(): AcquisitionParams {
  const stashed = readStash();
  if (stashed && Object.keys(stashed).length > 0) {
    return stashed;
  }
  return readFromSearch(window.location.search);
}

function readFromSearch(search: string): AcquisitionParams {
  const params = new URLSearchParams(search);
  return ACQUISITION_PARAM_KEYS.reduce<AcquisitionParams>((acc, key) => {
    const value = params.get(key);
    return value ? { ...acc, [key]: value } : acc;
  }, {});
}

function readStash(): AcquisitionParams | null {
  const { data } = tryCatchSync(() => {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (raw === null) {
      return null;
    }
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed)) {
      return null;
    }
    return ACQUISITION_PARAM_KEYS.reduce<AcquisitionParams>((acc, key) => {
      const value = parsed[key];
      return typeof value === 'string' && value.length > 0
        ? { ...acc, [key]: value }
        : acc;
    }, {});
  });
  return data;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export const acquisitionUtils = {
  stashAcquisitionParams,
  getAcquisitionParams,
};

export type AcquisitionParams = Partial<
  Record<(typeof ACQUISITION_PARAM_KEYS)[number], string>
>;
