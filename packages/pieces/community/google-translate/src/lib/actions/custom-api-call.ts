import { createCustomApiCallAction } from '@activepieces/pieces-common';

import { googleTranslateAuth } from '../auth';
import { TRANSLATE_API_ROOT } from '../common/client';

function assertTranslateHost(propsValue: unknown): void {
  const enteredUrl = readEnteredUrl(propsValue);
  if (enteredUrl === undefined || !isAbsoluteUrl(enteredUrl)) {
    return;
  }
  const origin = readOrigin(enteredUrl);
  if (origin !== TRANSLATE_API_ROOT) {
    throw new Error(
      `Custom API Call only sends your Google credentials to ${TRANSLATE_API_ROOT}, but the URL points to ${origin ?? enteredUrl}. Use a path relative to ${TRANSLATE_API_ROOT} (e.g. /language/translate/v2/languages) or a full URL on that host.`
    );
  }
}

function readEnteredUrl(propsValue: unknown): string | undefined {
  if (!isRecord(propsValue)) {
    return undefined;
  }
  const urlProp = propsValue['url'];
  if (!isRecord(urlProp)) {
    return undefined;
  }
  const url = urlProp['url'];
  return typeof url === 'string' ? url : undefined;
}

function isAbsoluteUrl(url: string): boolean {
  return url.startsWith('http://') || url.startsWith('https://');
}

function readOrigin(url: string): string | undefined {
  try {
    return new URL(url).origin;
  } catch {
    return undefined;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export const customApiCall = createCustomApiCallAction({
  auth: googleTranslateAuth,
  baseUrl: () => TRANSLATE_API_ROOT,
  authMapping: async (auth, propsValue) => {
    assertTranslateHost(propsValue);
    return {
      Authorization: `Bearer ${auth.access_token}`,
    };
  },
});
