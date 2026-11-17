import { PieceAuth, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const sallaAuth = PieceAuth.OAuth2({
  description: `Salla connects through your own private app. It is free and takes about 5 minutes to set up.

**Step 1 · Create the app**
In the [Salla Partners Portal](https://portal.salla.partners), go to **My Apps** → **Create App** and choose **Private** and **General**.

**Step 2 · Turn on login**
In the app, open **App Details** → **App Settings**:
- **OAuth Mode:** Custom Mode
- **Callback URLs:** paste this URL, then save

\`\`\`text
{{redirectUrl}}
\`\`\`

**Step 3 · Tick the permissions** (under **App Scopes**)
- **Read & write:** Orders, Products, Customers, Marketing, Webhooks
- **Read:** Categories, Brands, Abandoned Carts, Reviews, Payments, Branches

**Step 4 · Give the app access to your store**
- **To test:** under **App Testing**, click **Create Demo Store**, then **Install App**.
- **Your live store:** under **Merchant Store Access Requests**, add your store URL, then approve the request as the store owner.

**Step 5 · Connect**
Copy the **Client ID** and **Client Secret** from **App Keys** into the fields below, click **Connect**, and approve in the Salla window.

**Good to know:** if you tick a new permission later, or the connection sits unused for a month, reconnect it.`,
  required: true,
  authUrl: 'https://accounts.salla.sa/oauth2/auth',
  tokenUrl: 'https://accounts.salla.sa/oauth2/token',
  scope: ['offline_access'],
  props: {
    language: Property.StaticDropdown({
      displayName: 'Response Language',
      description:
        'Language Salla uses for names, statuses and error messages in responses. Salla answers in Arabic unless you pick English.',
      required: false,
      defaultValue: 'default',
      options: {
        disabled: false,
        options: [
          { label: 'Store default (Arabic)', value: 'default' },
          { label: 'English', value: 'en' },
          { label: 'Arabic', value: 'ar' },
        ],
      },
    }),
  },
  getConnectionIdentifier: async ({ auth }) => {
    try {
      const response = await httpClient.sendRequest<SallaUserInfoResponse>({
        method: HttpMethod.GET,
        url: 'https://accounts.salla.sa/oauth2/user/info',
        headers: {
          Authorization: `Bearer ${auth.access_token}`,
          Accept: 'application/json',
        },
        timeout: 5000,
      });
      const data = response.body?.data;
      const store = data?.merchant ?? data?.store;
      const storeLabel = store?.name || store?.username || (store?.id ? String(store.id) : undefined);
      if (storeLabel && data?.email) {
        return `${storeLabel} (${data.email})`;
      }
      return storeLabel || data?.email || undefined;
    } catch {
      return undefined;
    }
  },
});

type SallaUserInfoStore = {
  id?: number;
  name?: string;
  username?: string;
};

type SallaUserInfoResponse = {
  data?: {
    id?: number;
    name?: string;
    email?: string;
    merchant?: SallaUserInfoStore;
    store?: SallaUserInfoStore;
  };
};
