import { PieceAuth, Property } from '@activepieces/pieces-framework';
import { CoupaClient } from './common/client';

export const coupaAuth = PieceAuth.CustomAuth({
  description:
    'Connect using an OAuth 2.0 OpenID Connect client with the **Client Credentials** grant. In Coupa, go to **Setup → Integrations → OAuth2/OpenID Connect Clients**, create a client, and copy the Client ID and Client Secret. Scopes use the form `core.accounting.read` — list yours at `https://{your-instance}/oauth2/scopes`.',
  required: true,
  props: {
    instanceUrl: Property.ShortText({
      displayName: 'Coupa Instance URL',
      description:
        'Your Coupa hostname only, e.g. `company.coupahost.com` (without `https://`).',
      required: true,
    }),
    clientId: PieceAuth.SecretText({
      displayName: 'Client ID',
      required: true,
    }),
    clientSecret: PieceAuth.SecretText({
      displayName: 'Client Secret',
      required: true,
    }),
    scope: Property.LongText({
      displayName: 'OAuth Scopes',
      description:
        'Space-separated scopes granted to your OIDC client, e.g. `core.purchase_order.read core.purchase_order.write`.',
      required: true,
      defaultValue: 'core.common.read core.common.write',
    }),
  },
  validate: async ({ auth }) => {
    try {
      const client = new CoupaClient({
        instanceUrl: auth.instanceUrl,
        clientId: auth.clientId,
        clientSecret: auth.clientSecret,
        scope: auth.scope,
      });
      await client.getAccessToken();
      return { valid: true };
    } catch {
      return {
        valid: false,
        error:
          'Could not authenticate with Coupa. Check the instance URL, Client ID/Secret, and that the OIDC client uses the Client Credentials grant.',
      };
    }
  },
});
