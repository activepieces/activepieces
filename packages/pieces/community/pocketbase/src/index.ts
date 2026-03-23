import { createPiece, PieceAuth, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { getFullList } from './lib/actions/get-full-list';
import { getList } from './lib/actions/get-list';
import { getRecord } from './lib/actions/get-record';
import { createRecord } from './lib/actions/create-record';
import { updateRecord } from './lib/actions/update-record';
import { deleteRecord } from './lib/actions/delete-record';
import { PieceCategory } from '@activepieces/shared';

const markdown = `
Provide your PocketBase **host URL** and **superuser credentials**.

Find your admin panel at \`https://your-host/_/\`.
`;

export const pocketbaseAuth = PieceAuth.CustomAuth({
  required: true,
  description: markdown,
  props: {
    host: Property.ShortText({
      displayName: 'Host',
      description: 'Your Pocketbase host URL (e.g., https://pocketbase.your-project.com)',
      required: true,
    }),
    email: Property.ShortText({
      displayName: 'Superuser Email',
      description: 'The email address of your Pocketbase superuser',
      required: true,
    }),
    password: PieceAuth.SecretText({
      displayName: 'Superuser Password',
      description: 'The password of your Pocketbase superuser',
      required: true,
    }),
  },
  validate: async ({ auth }) => {
    try {
      const host = auth.host.replace(/\/+$/, '');
      const { email, password } = auth;

      try {
        const parsedUrl = new URL(host);
        if (parsedUrl.protocol !== 'https:' && parsedUrl.protocol !== 'http:') {
          return {
            valid: false,
            error: 'Host URL must use HTTP or HTTPS protocol',
          };
        }
      } catch {
        return {
          valid: false,
          error: 'Please enter a valid URL',
        };
      }

      try {
        const response = await httpClient.sendRequest({
          method: HttpMethod.POST,
          url: `${host}/api/collections/_superusers/auth-with-password`,
          body: {
            identity: email,
            password: password,
          },
        });

        if (response.body?.token) {
          return { valid: true };
        }

        return {
          valid: false,
          error: 'Authentication failed. Please check your superuser email and password.',
        };
      } catch (requestError: unknown) {
        const status = (requestError as { response?: { status?: number } })?.response?.status;
        if (status === 400 || status === 401 || status === 403) {
          return {
            valid: false,
            error: 'Invalid superuser email or password.',
          };
        }
        return {
          valid: false,
          error: `Could not connect to PocketBase: ${requestError instanceof Error ? requestError.message : 'Unknown error'}. Please check your host URL.`,
        };
      }
    } catch (error) {
      return {
        valid: false,
        error: `Failed to connect to PocketBase: ${error instanceof Error ? error.message : 'Unknown error'}. Please check your credentials.`,
      };
    }
  },
});



export const pocketbase = createPiece({
  displayName: 'Pocketbase',
  description: 'Interact with your PocketBase instance using superuser credentials.',
  auth: pocketbaseAuth,
  categories: [PieceCategory.DEVELOPER_TOOLS],
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/pocketbase.png',
  authors: ["anasaijaz"],
  actions: [getFullList, getList, getRecord, createRecord, updateRecord, deleteRecord],
  triggers: [],
});
