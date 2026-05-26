import { AuthenticationType, httpClient, HttpMethod } from "@activepieces/pieces-common";
import { PieceAuth, Property } from "@activepieces/pieces-framework";

export const PLUNK_BASE_URL = 'https://next-api.useplunk.com';

export const plunkAuth = PieceAuth.CustomAuth({
  description: `Find both API keys in your Plunk project's API settings.

  - Secret API key (\`sk_*\`) is required for sending email and managing contacts.
  - Public API key (\`pk_*\`) is optional.It is only used by the Track Event action.`,
  required: true,
  props: {
    secretKey: PieceAuth.SecretText({
      displayName: 'Secret API Key',
      description: 'Used for /v1/send, /v1/contacts, and the Custom API Call action.',
      required: true,
    }),
    publicKey: Property.ShortText({
      displayName: 'Public API Key',
      description: 'Required only for the Track Event action.',
      required: false,
    }),
  },
  validate: async ({ auth }) => {
    try {
      await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: `${PLUNK_BASE_URL}/contacts`,
        authentication: {
          type: AuthenticationType.BEARER_TOKEN,
          token: auth.secretKey,
        },
      });
      return { valid: true };
    } catch (e) {
      return {
        valid: false,
        error:
          'Could not authenticate with Plunk. Verify the secret API key is correct.',
      };
    }
  },
});