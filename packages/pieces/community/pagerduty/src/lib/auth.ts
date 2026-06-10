import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { PieceAuth } from '@activepieces/pieces-framework';
import { PAGERDUTY_API_BASE_URL, pagerDutyHeaders } from './common/client';

export const pagerDutyAuth = PieceAuth.SecretText({
  displayName: 'PagerDuty API Key',
  description:
    'PagerDuty REST API token from Integrations > API Access Keys. Activepieces sends it as Authorization: Token token=<API_KEY>.',
  required: true,
  validate: async ({ auth }) => {
    try {
      await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: `${PAGERDUTY_API_BASE_URL}/incidents`,
        queryParams: {
          limit: '1',
        },
        headers: pagerDutyHeaders(auth),
      });

      return {
        valid: true,
      };
    } catch (e: unknown) {
      const err = e as { response?: { status?: number } };
      if (err.response?.status === 401 || err.response?.status === 403) {
        return {
          valid: false,
          error: 'Invalid PagerDuty API key or insufficient permissions.',
        };
      }
      return {
        valid: false,
        error: `Connection failed: ${String(e).slice(0, 100)}`,
      };
    }
  },
});
