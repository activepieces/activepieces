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
import { CognosClient } from './lib/common/cognos-client';
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
    baseurl: Property.ShortText({
      displayName: 'Base URL',
      description: 'Cognos server URL (e.g., https://your-cognos-server.com)',
      required: true
    }),
    CAMNamespace: Property.ShortText({
      displayName: 'CAM Namespace',
      description: 'CAM namespace for authentication (e.g., LDAP)',
      required: true
    }),
    username: Property.ShortText({
      displayName: 'Username',
      description: 'Cognos username',
      required: true
    }),
    password: PieceAuth.SecretText({
      displayName: 'Password',
      description: 'Cognos password',
      required: true
    })
  },
  validate: async ({ auth }) => {
    const { username, password, CAMNamespace, baseurl } = auth;

    if (!username || !password || !CAMNamespace || !baseurl) {
      return {
        valid: false,
        error: 'All fields are required'
      };
    }

    try {
      const client = new CognosClient(auth);
      await client.createSession();
      return {
        valid: true
      };
    } catch (error) {
      return {
        valid: false,
        error: `Authentication failed: ${error instanceof Error ? error.message : 'Unknown error'}`
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
  authors: ['fortunamide', 'onyedikachi-david'],
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
      baseUrl: (auth) => `${(auth as any).baseurl}/api/v1`,
      auth: ibmCognoseAuth,
      authMapping: async (auth: any) => {
        try {
          const client = new CognosClient(auth.props);
          await client.createSession();
          
          if (client['sessionCookies']) {
            return {
              Cookie: client['sessionCookies']
            };
          }

          return {};
        } catch (error) {
          throw new Error(
            `Failed to authenticate: ${error instanceof Error ? error.message : 'Unknown error'}`
          );
        }
      }
    })
  ],
  triggers: []
});
