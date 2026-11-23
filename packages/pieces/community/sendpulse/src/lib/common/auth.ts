import { PieceAuth } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { sendpulseApiCall, sendpulseErrorStatus } from './client';

function validationMessage(error: unknown): string {
  const status = sendpulseErrorStatus(error);
  const detail = error instanceof Error ? error.message : String(error);
  if (status === 400 || status === 401) {
    return `Invalid Client ID or Client Secret, or the REST API is not activated in SendPulse (Settings → API). ${detail}`;
  }
  return `Could not verify the SendPulse credentials: ${detail}`;
}

export const sendpulseAuth = PieceAuth.CustomAuth({
  description: 'Enter your SendPulse client credentials (Account Settings → API → REST API).',
  props: {
    clientId: PieceAuth.SecretText({
      displayName: 'Client ID',
      required: true,
    }),
    clientSecret: PieceAuth.SecretText({
      displayName: 'Client Secret',
      required: true,
    }),
  },
  validate: async ({ auth }) => {
    try {
      await sendpulseApiCall({
        method: HttpMethod.GET,
        resourceUri: '/addressbooks',
        query: { limit: 1, offset: 0 },
        auth,
        operation: 'credential check',
        skipTokenCache: true,
      });
      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        error: validationMessage(error),
      };
    }
  },
  required: true,
});
