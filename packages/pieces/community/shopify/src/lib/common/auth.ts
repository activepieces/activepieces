import {
  HttpError,
  HttpMethod,
  httpClient,
} from '@activepieces/pieces-common';
import {
  AppConnectionType,
  AppConnectionValueForAuthProperty,
  OAuth2GrantType,
  PieceAuth,
  Property,
} from '@activepieces/pieces-framework';

const adminTokenMarkdown = `
Use this option for custom apps created in the Shopify admin **before January 1, 2026**. Shopify no longer lets you create these apps, but existing ones keep working and their Admin API access token does not expire. For a new app, choose the **Dev Dashboard app** option instead.

**Shop Name**:

You can find your shop name in the URL. For example, if the URL is \`https://example.myshopify.com/admin\`, then your shop name is **example**.

**Admin Token**:

1. Log in to your Shopify admin.
2. Go to **Settings** -> **Apps and sales channels** -> **Develop apps**.
3. Open your existing custom app.
4. Under **Configuration**, check that the Admin API scopes include: \`read_orders\`, \`write_orders\`, \`read_customers\`, \`write_customers\`, \`read_products\`, \`write_products\`, \`read_draft_orders\`, \`write_draft_orders\`, \`read_locations\`, \`read_inventory\`, \`write_inventory\`, \`read_themes\`, \`write_fulfillments\`.
5. Under **API credentials**, copy the **Admin API access token**.
`;

const devDashboardMarkdown = `
Use this option for apps created in the Shopify **Dev Dashboard** (all new apps from January 1, 2026). Activepieces exchanges the app's client ID and client secret for an access token and renews it automatically every 24 hours.

**Important:** the app and the store must belong to the **same Shopify organization**, otherwise Shopify rejects the connection.

1. Go to the [Shopify Dev Dashboard](https://dev.shopify.com/dashboard) and click **Create app**. Give it a name.
2. Create a version of the app and, under **Access** -> **Scopes**, select these Admin API scopes: \`read_orders\`, \`write_orders\`, \`read_customers\`, \`write_customers\`, \`read_products\`, \`write_products\`, \`read_draft_orders\`, \`write_draft_orders\`, \`read_locations\`, \`read_inventory\`, \`write_inventory\`, \`read_themes\`, \`write_fulfillments\`.
3. Release a version with these scopes and install/approve it on the store: from the app's **Home** page, click **Install app** and install it on your store (reinstall it if it was installed before the scopes were added). The store must be in the same organization as the app.
4. Open the app's **Settings** page and copy the **Client ID** and **Client secret**.
5. Enter your shop name below (for \`https://example.myshopify.com\`, enter **example**), then paste the client ID and client secret.

**Note:** If you change the app's scopes later, reconnect this connection so a new token is issued (tokens keep the scopes they were issued with for up to 24 hours).
`;

const NO_APPROVED_SCOPES_ERROR =
  'Your Shopify app has no approved Admin API scopes on this store. In the Dev Dashboard, release an app version that includes the scopes, then install/approve it on the store (reinstall if needed), and try again.';

export function getBaseUrl(shopName: string) {
  return `https://${shopName}.myshopify.com/admin/api/2023-10`;
}

export const shopifyAdminTokenAuth = PieceAuth.CustomAuth({
  displayName: 'Admin Token (legacy custom app)',
  description: adminTokenMarkdown,
  required: true,
  props: {
    shopName: Property.ShortText({
      displayName: 'Shop Name',
      required: true,
    }),
    adminToken: PieceAuth.SecretText({
      displayName: 'Admin Token',
      required: true,
    }),
  },
  validate: async ({ auth }) => {
    try {
      await httpClient.sendRequest({
        url: `${getBaseUrl(auth.shopName)}/shop.json`,
        method: HttpMethod.GET,
        headers: {
          'X-Shopify-Access-Token': auth.adminToken,
        },
      });
      return {
        valid: true,
      };
    } catch (e) {
      return {
        valid: false,
        error: 'Invalid Shop Name or Admin Token',
      };
    }
  },
});

export const shopifyDevDashboardAuth = PieceAuth.OAuth2({
  displayName: 'Dev Dashboard app',
  description: devDashboardMarkdown,
  required: true,
  grantType: OAuth2GrantType.CLIENT_CREDENTIALS,
  authUrl: '',
  tokenUrl: 'https://{shopName}.myshopify.com/admin/oauth/access_token',
  scope: [],
  props: {
    shopName: Property.ShortText({
      displayName: 'Shop Name',
      description:
        'The part before .myshopify.com in your store URL. For https://example.myshopify.com, enter example.',
      required: true,
    }),
  },
  validate: async ({ auth }) => {
    const shopName = auth.props?.['shopName'];
    if (typeof shopName !== 'string' || shopName.length === 0) {
      return { valid: false, error: 'Shop Name is required.' };
    }
    try {
      const scopesResponse = await httpClient.sendRequest<{
        access_scopes?: { handle: string }[];
      }>({
        url: `https://${shopName}.myshopify.com/admin/oauth/access_scopes.json`,
        method: HttpMethod.GET,
        headers: {
          'X-Shopify-Access-Token': auth.access_token,
        },
      });
      const accessScopes = scopesResponse.body?.access_scopes;
      if (!Array.isArray(accessScopes) || accessScopes.length === 0) {
        return { valid: false, error: NO_APPROVED_SCOPES_ERROR };
      }
      await httpClient.sendRequest({
        url: `${getBaseUrl(shopName)}/shop.json`,
        method: HttpMethod.GET,
        headers: {
          'X-Shopify-Access-Token': auth.access_token,
        },
      });
      return { valid: true };
    } catch (e) {
      return {
        valid: false,
        error: devDashboardValidationError(
          e instanceof HttpError ? e.response.status : undefined,
        ),
      };
    }
  },
});

export const shopifyAuth = [shopifyAdminTokenAuth, shopifyDevDashboardAuth];

export const shopifyAuthHelpers = {
  getShopName,
  getAccessToken,
  getBaseUrl: (auth: ShopifyAuth) => getBaseUrl(getShopName(auth)),
  getAuthHeaders: (auth: ShopifyAuth) => ({
    'X-Shopify-Access-Token': getAccessToken(auth),
  }),
};

function devDashboardValidationError(status: number | undefined): string {
  switch (status) {
    case 401:
      return 'Shopify rejected the access token. Check that the app is installed on this store and that the store belongs to the same organization as the app.';
    case 403:
      return 'The app is missing required Admin API scopes. Add the scopes listed above to the app version, release it, and reinstall the app on the store.';
    case 404:
      return 'Store not found. Check the Shop Name (for https://example.myshopify.com, enter example).';
    default:
      return 'Could not connect to Shopify with this Dev Dashboard app. Check the Shop Name, client ID and client secret.';
  }
}

function getShopName(auth: ShopifyAuth): string {
  if (auth.type === AppConnectionType.CUSTOM_AUTH) {
    return auth.props.shopName;
  }
  const shopName = auth.props?.['shopName'];
  return typeof shopName === 'string' ? shopName : '';
}

function getAccessToken(auth: ShopifyAuth): string {
  if (auth.type === AppConnectionType.CUSTOM_AUTH) {
    return auth.props.adminToken;
  }
  return auth.access_token;
}

export type ShopifyAuth = AppConnectionValueForAuthProperty<typeof shopifyAuth>;
