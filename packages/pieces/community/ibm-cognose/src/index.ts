import {
  createPiece,
  PieceAuth,
  Property
} from '@activepieces/pieces-framework';
import {
  HttpMethod,
  httpClient,
  createCustomApiCallAction
} from '@activepieces/pieces-common';
import { PieceCategory } from '@activepieces/shared';
import { createDataSourceAction } from './lib/actions/create-data-source';
import { updateDataSourceAction } from './lib/actions/update-data-source';
import { deleteDataSourceAction } from './lib/actions/delete-data-source';
import { getDataSourceAction } from './lib/actions/get-data-source';
import { updateContentObjectAction } from './lib/actions/update-content-object';
import { getContentObjectAction } from './lib/actions/get-content-object';
import { moveContentObjectAction } from './lib/actions/move-content-object';
import { copyContentObjectAction } from './lib/actions/copy-content-object';

export const ibmCognoseAuth = PieceAuth.CustomAuth({
  required: true,
  description: `
## IBM Cognos Analytics Authentication

Enter your Cognos Analytics credentials:
- **Username**: Your Cognos username
- **Password**: Your Cognos password
  `,
  props: {
    username: Property.ShortText({
      displayName: 'Username',
      description: 'Your Cognos username',
      required: true
    }),
    password: PieceAuth.SecretText({
      displayName: 'Password',
      description: 'Your Cognos password',
      required: true
    })
  },
  validate: async ({ auth }) => {
    // For now, just validate that username and password are provided
    // The actual server validation will happen when actions are executed
    const { username, password } = auth;

    if (!username || !password) {
      return {
        valid: false,
        error: 'Username and password are required'
      };
    }

    return {
      valid: true
    };
  }
});

export const ibmCognose = createPiece({
  displayName: 'IBM Cognos Analytics',
  description:
    'Business intelligence and performance management suite for data analysis and reporting',
  auth: ibmCognoseAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/ibm-cognose.png',
  categories: [PieceCategory.BUSINESS_INTELLIGENCE],
  authors: [],
  actions: [
    createDataSourceAction,
    getDataSourceAction,
    updateDataSourceAction,
    deleteDataSourceAction,
    getContentObjectAction,
    updateContentObjectAction,
    moveContentObjectAction,
    copyContentObjectAction,
    createCustomApiCallAction({
      baseUrl: () => 'https://your-cognos-server.com/api/v1', // TODO: Configure server URL
      auth: ibmCognoseAuth,
      authMapping: async (auth: any) => {
        // Create session first to get authentication token
        const parameters = [
          { name: 'CAMNamespace', value: 'LDAP' }, // TODO: Configure namespace
          { name: 'CAMUsername', value: auth.username },
          { name: 'CAMPassword', value: auth.password }
        ];

        const sessionResponse = await httpClient.sendRequest({
          method: HttpMethod.PUT,
          url: 'https://your-cognos-server.com/api/v1/session', // TODO: Configure server URL
          headers: {
            'Content-Type': 'application/json'
          },
          body: {
            parameters
          }
        });

        // Extract session cookies for subsequent requests
        const cookies = sessionResponse.headers?.['set-cookie'];
        if (cookies) {
          return {
            Cookie: Array.isArray(cookies) ? cookies.join('; ') : cookies
          };
        }

        return {};
      }
    })
  ],
  triggers: []
});
