import { PieceAuth, Property } from '@activepieces/pieces-framework';
import { OdooClient, OdooRequestError } from './common/client';

function urlPort(value: unknown): string | null {
  try {
    const port = new URL(String(value ?? '').trim()).port;
    return port === '' ? null : port;
  } catch {
    return null;
  }
}

export const odooAuth = PieceAuth.CustomAuth({
  description: `Connect with an Odoo API key.

1. In Odoo, click your avatar (top right) → **My Profile** (or **Preferences**) → **Account Security** tab.
2. Click **New API Key**, confirm your password, give it a name and copy the key. Odoo shows it once.
3. The **Username** is the login you sign in with (usually your email).
4. The **Database** is shown in the URL of the database manager, or ask your Odoo admin. On Odoo Online it is usually the first part of the address (for **mycompany**.odoo.com it is \`mycompany\`).

Odoo Online allows the external API only on the Custom plan. API keys can expire, so create a new one if the connection stops working.`,
  props: {
    base_url: Property.ShortText({
      displayName: 'Odoo URL',
      description: 'The address of your Odoo without a port, for example https://mycompany.odoo.com. Put a port in the Port field.',
      required: true,
    }),
    database: Property.ShortText({
      displayName: 'Odoo Database',
      description: 'The database name, for example mycompany',
      required: true,
    }),
    username: Property.ShortText({
      displayName: 'Odoo Username',
      description: 'The login of the Odoo user, usually an email address',
      required: true,
    }),
    api_key: PieceAuth.SecretText({
      displayName: 'Odoo API Key',
      description: 'The API key created under My Profile → Account Security → New API Key',
      required: true,
    }),
    port: Property.Number({
      displayName: 'Port (optional)',
      description:
        'Leave empty to use port 443 (the default, right for Odoo Online and most HTTPS setups). Set it only when Odoo listens on another port, for example 8069 for a self-hosted Odoo reached directly.',
      required: false,
    }),
  },
  validate: async ({ auth }) => {
    const port = urlPort(auth.base_url);
    if (port !== null) {
      return {
        valid: false,
        error: `Remove ":${port}" from the Odoo URL and put ${port} in the Port field instead.`,
      };
    }
    let client: OdooClient;
    try {
      client = OdooClient.fromAuth({ auth });
    } catch (error) {
      return { valid: false, error: error instanceof Error ? error.message : String(error) };
    }
    try {
      await client.authenticate();
      return { valid: true };
    } catch (error) {
      if (error instanceof OdooRequestError && error.message.startsWith('Odoo rejected the login')) {
        return { valid: false, error: 'Invalid credentials. Please check the database, username and API key.' };
      }
      return {
        valid: false,
        error: `Connection failed. Please check the URL, port and credentials and try again. (${error instanceof Error ? error.message : String(error)})`,
      };
    }
  },
  required: true,
});
