import { PieceAuth, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const sallaAuth = PieceAuth.OAuth2({
  description: `Connect a Salla store through your own private Salla app.

1. Sign in to the [Salla Partners Portal](https://portal.salla.partners) and open **My Apps**, then **Create App**. Choose a **Private** app of the **General** type.
2. Open the app's **App Details**. Under **App Settings**, set **OAuth Mode** to **Custom Mode**.
3. Paste the **Redirect URL** shown above into the app's **Callback URLs** field and save.
4. Under **App Scopes**, tick at least **Orders** (read & write), **Products** (read & write), **Customers** (read & write), **Marketing** (read & write, for coupons), **Webhooks** (read & write), **Categories** (read), **Brands** (read), **Abandoned Carts** (read), **Reviews** (read), **Payments** (read) and **Branches** (read). Each scope is either read or read & write.
5. Give the app access to your store: install it on a Salla demo store, or add your store URL under **Merchant Store Access Requests** and approve the request as the store owner.
6. Copy the app's **Client ID** and **Client Secret** into the fields below, then click **Connect** and approve the access in Salla.

Notes:
- If you add a scope to the Salla app later, reconnect this connection so the new scope reaches the token.
- Salla expires a refresh token that is not used for a month. If the connection stays idle that long, reconnect it.`,
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
