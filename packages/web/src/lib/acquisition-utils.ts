import { tryCatchSync } from '@activepieces/core-utils';
import {
  ATTRIBUTION_PARAM_KEYS,
  ATTRIBUTION_STORAGE_KEY,
  ATTRIBUTION_STORAGE_TTL_MS,
  ATTRIBUTION_VALUE_MAX_LENGTH,
  AttributionParams,
  attributionUtils,
} from '@activepieces/shared';

function stashAcquisitionParams(): void {
  const fromUrl = attributionUtils.readAttributionFromSearch({
    search: window.location.search,
  });
  if (attributionUtils.isEmptyAttribution({ attribution: fromUrl })) {
    return;
  }
  tryCatchSync(() => {
    if (readStash() !== null) {
      return;
    }
    const entry: StoredAttribution = {
      params: fromUrl,
      capturedAt: Date.now(),
    };
    localStorage.setItem(ATTRIBUTION_STORAGE_KEY, JSON.stringify(entry));
  });
}

function getAcquisitionParams(): AttributionParams {
  const stashed = readStash();
  if (stashed !== null) {
    return stashed;
  }
  return attributionUtils.readAttributionFromSearch({
    search: window.location.search,
  });
}

function clearAcquisitionParams(): void {
  tryCatchSync(() => localStorage.removeItem(ATTRIBUTION_STORAGE_KEY));
}

function readStash(): AttributionParams | null {
  const { data } = tryCatchSync(() => {
    const raw = localStorage.getItem(ATTRIBUTION_STORAGE_KEY);
    if (raw === null) {
      return null;
    }
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed) || typeof parsed.capturedAt !== 'number') {
      return null;
    }
    if (Date.now() - parsed.capturedAt > ATTRIBUTION_STORAGE_TTL_MS) {
      return null;
    }
    if (!isRecord(parsed.params)) {
      return null;
    }
    const params = pickAttribution(parsed.params);
    return attributionUtils.isEmptyAttribution({ attribution: params })
      ? null
      : params;
  });
  return data;
}

function pickAttribution(source: Record<string, unknown>): AttributionParams {
  return ATTRIBUTION_PARAM_KEYS.reduce<AttributionParams>((acc, key) => {
    const value = source[key];
    if (typeof value !== 'string' || value.trim().length === 0) {
      return acc;
    }
    return {
      ...acc,
      [key]: value.trim().slice(0, ATTRIBUTION_VALUE_MAX_LENGTH),
    };
  }, {});
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export const acquisitionUtils = {
  stashAcquisitionParams,
  getAcquisitionParams,
  clearAcquisitionParams,
};

type StoredAttribution = {
  params: AttributionParams;
  capturedAt: number;
};
