import {
  AppConnectionType,
  PieceAuth,
  Property,
} from '@activepieces/pieces-framework';

import { databricksApi } from './common/api';

export const databricksAuth = PieceAuth.CustomAuth({
  displayName: 'Service Principal',
  description: `Connect with a Databricks service principal (OAuth machine-to-machine). Activepieces exchanges the client ID and secret for short-lived access tokens automatically.

1. In your Databricks workspace, open **Settings → Identity and access → Service principals** and add (or pick) a service principal.
2. On the service principal's **Secrets** tab, click **Generate secret** and copy the **Client ID** and **Secret**.
3. Grant the service principal **Can use** on the SQL warehouse, and the Unity Catalog privileges it needs (for example \`USE CATALOG\`, \`USE SCHEMA\`, \`SELECT\`, \`MODIFY\`, \`READ VOLUME\`, \`WRITE VOLUME\`). For Genie, give it **Can run** on the Genie space.
4. Copy your workspace URL from the browser address bar, e.g. \`https://dbc-a1b2c3d4-e5f6.cloud.databricks.com\`.`,
  required: true,
  props: {
    workspaceUrl: Property.ShortText({
      displayName: 'Workspace URL',
      description:
        'Your Databricks workspace URL, e.g. https://dbc-a1b2c3d4-e5f6.cloud.databricks.com or https://adb-1234567890123456.7.azuredatabricks.net',
      required: true,
    }),
    clientId: Property.ShortText({
      displayName: 'Client ID',
      description:
        "The service principal's client ID (also called application ID), e.g. 6b1d5c2e-0a4f-4c3b-9f1e-2d7a8b9c0d1e.",
      required: true,
    }),
    clientSecret: PieceAuth.SecretText({
      displayName: 'Client Secret',
      description:
        "The OAuth secret generated on the service principal's Secrets tab.",
      required: true,
    }),
  },
  validate: async ({ auth }) => {
    try {
      const token = await databricksApi.getAccessToken({ credentials: auth });
      await databricksApi.getCurrentUser({
        auth: {
          type: AppConnectionType.CUSTOM_AUTH,
          access_token: token.access_token,
          props: auth,
        },
      });
      return { valid: true };
    } catch {
      return {
        valid: false,
        error:
          'Could not sign in to Databricks. Check the workspace URL, client ID and client secret.',
      };
    }
  },
  refresh: {
    generate: async ({ auth }) => {
      const token = await databricksApi.getAccessToken({ credentials: auth });
      return { access_token: token.access_token, expires_in: token.expires_in };
    },
    defaultExpiresIn: 3600,
  },
});
