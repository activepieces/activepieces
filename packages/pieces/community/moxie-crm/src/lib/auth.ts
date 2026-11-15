import { HttpMethod } from '@activepieces/pieces-common';
import { PieceAuth, Property } from '@activepieces/pieces-framework';
import {
  MOXIE_BASE_URL_EXAMPLE,
  MOXIE_SETTINGS_PATH,
  moxieRequest,
  responseStatusOf,
} from './common/client';
import { MoxieSimpleAccount } from './common/models';

export const moxieCRMAuth = PieceAuth.CustomAuth({
  required: true,
  description: `
  To connect your Moxie workspace:

  1. Log in to Moxie and click **Workspace Settings** (bottom left).
  2. Open **Connected Apps** and go to the **Integrations** tab.
  3. Under **Custom Integration**, click **Enable Custom Integration**.
  4. Copy the **API Key** and the **Base URL** (it looks like \`${MOXIE_BASE_URL_EXAMPLE}\`) and click **Save**.
  `,
  props: {
    apiKey: PieceAuth.SecretText({
      displayName: 'API Key',
      description: 'The API Key of the Moxie CRM account',
      required: true,
    }),
    baseUrl: Property.ShortText({
      displayName: 'Base URL',
      description: `The Base URL shown next to the API key, for example ${MOXIE_BASE_URL_EXAMPLE}`,
      required: true,
    }),
  },
  validate: async ({ auth }) => {
    try {
      const account = await moxieRequest<MoxieSimpleAccount>({
        credentials: { baseUrl: auth.baseUrl, apiKey: auth.apiKey },
        method: HttpMethod.GET,
        path: '/api/auth',
      });
      if (typeof account !== 'object' || account === null || account.accountId === undefined) {
        return { valid: false, error: notApiUrlMessage };
      }
      return { valid: true };
    } catch (error) {
      const status = responseStatusOf({ error });
      if (status === 401 || status === 403) {
        return { valid: false, error: `Invalid API key. Copy it again from ${MOXIE_SETTINGS_PATH}.` };
      }
      if (status === 404 || status === 200) {
        return { valid: false, error: notApiUrlMessage };
      }
      return { valid: false, error: error instanceof Error ? error.message : String(error) };
    }
  },
});

const notApiUrlMessage = `This Base URL is not the Moxie API URL. Copy the Base URL from ${MOXIE_SETTINGS_PATH}; it looks like ${MOXIE_BASE_URL_EXAMPLE}.`;
