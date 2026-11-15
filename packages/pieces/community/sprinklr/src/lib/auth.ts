import { OAuth2AuthorizationMethod, PieceAuth, Property } from '@activepieces/pieces-framework';
import { sprinklrClient, SprinklrAuthValue } from './common/client';
import { sprinklrEnvironments } from './common/environments';
import { SprinklrApiError } from './common/errors';

const DESCRIPTION = `**Before you start**

- Use a Sprinklr service user, not a personal account. It needs the **Configure Developer Apps** permission (to create the app) and the **Generate Token** permission (to sign in).
- Create a **new** API key for Activepieces. Sprinklr keeps one token per key. If you reuse a key that another tool uses, that tool is signed out.

**Steps**

1. In Sprinklr open **All Settings → APIs and Integrations → Developer Apps**. In the classic view it is **All Settings → Manage Customer → Developer Apps**.
2. Click **+ Create App**. Enter a name. Set **Callback URL** to exactly: \`{{redirectUrl}}\`
3. Save. Open **⋮ → Manage API Key/Token** and click **+ API Key**. Copy the key and the secret now. The secret is shown once.
4. Paste the API key into **Client ID** and the secret into **Client Secret**.
5. Choose your **Environment**. To find it: in Sprinklr, right-click the home page, choose **View Page Source** and search for \`sentry-environment\`.
6. Leave **Callback URL** as it is on Activepieces Cloud. On a self-hosted instance, paste the Redirect URL shown above.
7. Click **Connect**, sign in to Sprinklr as the service user, and grant the workspaces this connection should see.

One connection per API key. For a second connection, create a second key.`;

const ENVIRONMENT_STATUSES = [401, 404, 421];

async function validateConnection(auth: SprinklrAuthValue): Promise<{ valid: true } | { valid: false; error: string }> {
  try {
    await sprinklrClient.getMe({ auth });
    return { valid: true };
  } catch (error) {
    return { valid: false, error: validationMessage(error) };
  }
}

async function connectionIdentifier(auth: SprinklrAuthValue): Promise<string | undefined> {
  try {
    const user = await sprinklrClient.getMe({ auth });
    return user?.email ?? user?.name;
  } catch {
    return undefined;
  }
}

function validationMessage(error: unknown): string {
  if (error instanceof SprinklrApiError && ENVIRONMENT_STATUSES.includes(error.status)) {
    return `Sprinklr did not accept this connection on the chosen Environment (${error.status}). Check the Environment: in Sprinklr, view the page source of the home page and search for sentry-environment. Also check that this API key is not used by another tool, then reconnect.`;
  }
  const detail = error instanceof Error ? error.message : String(error);
  return `Could not verify the Sprinklr connection. ${detail}`;
}

export const sprinklrAuth = PieceAuth.OAuth2({
  description: DESCRIPTION,
  required: true,
  authUrl: '{base}/oauth/authorize',
  tokenUrl: '{base}/oauth/token?redirect_uri={callback}',
  scope: [],
  prompt: 'omit',
  extra: { access_type: '' },
  authorizationMethod: OAuth2AuthorizationMethod.BODY,
  pkce: false,
  props: {
    base: Property.StaticDropdown({
      displayName: 'Environment',
      description: 'Your Sprinklr environment. See step 5 above to find it.',
      required: true,
      options: {
        disabled: false,
        options: sprinklrEnvironments.OPTIONS,
      },
    }),
    callback: Property.ShortText({
      displayName: 'Callback URL',
      description: 'Must match the Callback URL of your Sprinklr Developer App.',
      required: true,
      defaultValue: sprinklrEnvironments.DEFAULT_CALLBACK_URL,
    }),
  },
  validate: async ({ auth }) => validateConnection(auth),
  getConnectionIdentifier: async ({ auth }) => connectionIdentifier(auth),
});
