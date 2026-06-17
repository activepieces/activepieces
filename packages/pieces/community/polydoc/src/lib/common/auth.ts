import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { PieceAuth, Property } from '@activepieces/pieces-framework';
import { DEFAULT_BASE_URL, SCREENSHOT_CONVERT_PATH } from './constants';
import { resolveAuth } from './client';

const AUTH_GUIDE = `Get an API key from the PolyDoc dashboard (dashboard.polydoc.tech, API Keys). It is sent as Authorization: Bearer <key>.

Turn on **Sandbox** to test against sandbox quota (output is watermarked). Leave it off for production conversions.`;

export const polydocAuth = PieceAuth.CustomAuth({
  description: AUTH_GUIDE,
  required: true,
  props: {
    apiKey: PieceAuth.SecretText({
      displayName: 'API Key',
      description: 'Your PolyDoc API key from dashboard.polydoc.tech.',
      required: true,
    }),
    sandbox: Property.Checkbox({
      displayName: 'Sandbox',
      description: 'Use sandbox quota (watermarked output).',
      required: false,
      defaultValue: false,
    }),
  },
  validate: async ({ auth }) => {
    const { apiKey } = resolveAuth(auth);
    if (!apiKey) {
      return { valid: false, error: 'API key is required.' };
    }
    try {
      // Minimal forced-sandbox screenshot: proves the key is valid without
      // touching production quota. 200 means valid, 401 means a bad key.
      await httpClient.sendRequest({
        method: HttpMethod.POST,
        url: `${DEFAULT_BASE_URL.replace(/\/+$/, '')}${SCREENSHOT_CONVERT_PATH}`,
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'X-Sandbox': 'true',
        },
        body: { source: '<p>polydoc</p>', screenshot: { type: 'png' } },
        responseType: 'arraybuffer',
      });
      return { valid: true };
    } catch (error) {
      const status = (error as { response?: { status?: number } })?.response?.status;
      if (status === 401) {
        return { valid: false, error: 'Invalid PolyDoc API key.' };
      }
      return {
        valid: false,
        error: 'Could not reach the PolyDoc API. Check your API key and try again.',
      };
    }
  },
});
