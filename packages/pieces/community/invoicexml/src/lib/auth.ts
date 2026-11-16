import {
  AuthenticationType,
  httpClient,
  HttpMethod,
} from '@activepieces/pieces-common';
import { PieceAuth } from '@activepieces/pieces-framework';
import { INVOICEXML_BASE_URL } from './common';

export const invoicexmlAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: `To get your API key:

1. Sign up or log in at [www.invoicexml.com](https://www.invoicexml.com/account/signup).
2. Open **Account > Authentication** ([www.invoicexml.com/account/authentication](https://www.invoicexml.com/account/authentication)).
3. Copy your API key and paste it here.`,
  required: true,
  validate: async ({ auth }) => {
    try {
      await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: `${INVOICEXML_BASE_URL}/me`,
        authentication: {
          type: AuthenticationType.BEARER_TOKEN,
          token: auth,
        },
      });
      return { valid: true };
    } catch {
      return {
        valid: false,
        error: 'Invalid API key. Copy it again from Account > Authentication on www.invoicexml.com.',
      };
    }
  },
});
