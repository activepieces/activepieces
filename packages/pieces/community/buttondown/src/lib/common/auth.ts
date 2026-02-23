import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { PieceAuth } from '@activepieces/pieces-framework';
import { BUTTONDOWN_BASE_URL } from './client';

interface ButtondownPingResponse {
  newsletter?: string;
}

interface ButtondownError {
  detail?: string;
  error?: string;
  message?: string;
}

export const buttondownAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description:
    'Create an API key from https://buttondown.com/settings/api and paste it here. The key should start with `bd_`.',
  required: true,
  validate: async ({ auth }) => {
    if (!auth) {
      return {
        valid: false,
        error: 'API key is required.',
      };
    }

    try {
      await httpClient.sendRequest<ButtondownPingResponse>({
        method: HttpMethod.GET,
        url: `${BUTTONDOWN_BASE_URL}/newsletters`,
        headers: {
          Authorization: `Token ${auth}`,
        },
      });
      return {
        valid: true,
      };
    } catch (unknownError: unknown) {
      const error = unknownError as {
        response?: { status?: number; body?: ButtondownError };
        message?: string;
      };
      const status = error.response?.status;
      const body = error.response?.body ?? {};
      const message =
        body.detail ??
        body.error ??
        body.message ??
        (status === 401 ? 'Invalid API key.' : 'Failed to verify the API key.');

      return {
        valid: false,
        error: message,
      };
    }
  },
});
