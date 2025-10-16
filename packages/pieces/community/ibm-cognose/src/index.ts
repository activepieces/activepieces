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

To authenticate with IBM Cognos Analytics, you need:

- **Server URL**: Your Cognos Analytics server URL (e.g., https://your-server.com)
- **Namespace**: Authentication namespace (e.g., LDAP)
- **Username**: Your Cognos username
- **Password**: Your Cognos password

The authentication uses the Cognos REST API session endpoint with username/password credentials.
  `,
  props: {
    serverUrl: Property.ShortText({
      displayName: 'Server URL',
      description:
        'Your Cognos Analytics server URL (e.g., https://your-server.com)',
      required: true
    }),
    namespace: Property.ShortText({
      displayName: 'Namespace',
      description: 'Authentication namespace (e.g., LDAP)',
      required: true
    }),
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
    try {
      const { serverUrl, namespace, username, password } = auth;

      // Prepare authentication parameters
      const parameters = [
        { name: 'CAMNamespace', value: namespace },
        { name: 'CAMUsername', value: username },
        { name: 'CAMPassword', value: password }
      ];

      // Test authentication by creating a session
      const response = await httpClient.sendRequest({
        method: HttpMethod.PUT,
        url: `${serverUrl.replace(/\/$/, '')}/api/v1/session`,
        headers: {
          'Content-Type': 'application/json'
        },
        body: {
          parameters
        }
      });

      if (response.status >= 200 && response.status < 300) {
        return {
          valid: true
        };
      } else {
        return {
          valid: false,
          error: `Authentication failed: ${response.status} ${response.body}`
        };
      }
    } catch (error) {
      return {
        valid: false,
        error: `Authentication failed: ${error}`
      };
    }
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
      baseUrl: (auth: any) => `${auth.serverUrl.replace(/\/$/, '')}/api/v1`,
      auth: ibmCognoseAuth,
      authMapping: async (auth: any) => {
        // Create session first to get authentication token
        const parameters = [
          { name: 'CAMNamespace', value: auth.namespace },
          { name: 'CAMUsername', value: auth.username },
          { name: 'CAMPassword', value: auth.password }
        ];

        const sessionResponse = await httpClient.sendRequest({
          method: HttpMethod.PUT,
          url: `${auth.serverUrl.replace(/\/$/, '')}/api/v1/session`,
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
