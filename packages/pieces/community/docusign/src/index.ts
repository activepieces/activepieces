import { AxiosError } from 'axios';

import {
  createPiece,
  PieceAuth,
  Property,
} from '@activepieces/pieces-framework';
import { createCustomApiCallAction } from '@activepieces/pieces-common';

import { createApiClient } from './lib/common';
import { listEnvelopes } from './lib/actions/list-envelopes';
import { getEnvelope } from './lib/actions/get-envelope';
import { getDocument } from './lib/actions/get-document';

export const docusignAuth = PieceAuth.CustomAuth({
  required: true,
  props: {
    clientId: Property.ShortText({
      displayName: 'Integration key / Client ID',
      description:
        'This can be obtained in your developer account from the<https://admindemo.docusign.com/authenticate?goTo=appsAndKeys|Apps and Keys> page. See the https://support.docusign.com/guides/ndse-admin-guide-api-and-keys|Docusign eSignature Admin Guide> for more information.',
      required: true,
    }),
    privateKey: PieceAuth.SecretText({
      displayName: 'RSA private key',
      description:
        'This is for the integration key you obtained above and can also be created on the <https://admindemo.docusign.com/authenticate?goTo=appsAndKeys|Apps and Keys> page. You only need the private key, and it can only be copied once. Make sure to retain it for your records.',
      required: true,
    }),
    environment: Property.StaticDropdown({
      displayName: 'Environment',
      required: true,
      options: {
        options: [
          { label: 'Demo / Test', value: 'demo' },
          { label: 'US production', value: 'www' },
          { label: 'EU production', value: 'eu' },
        ],
      },
    }),
    impersonatedUserId: Property.ShortText({
      displayName: 'Impersonated user ID',
      description:
        'This is a GUID identifying the Docusign user that you will be impersonating with the access token. Your own User ID can be found at the top of the<https://admindemo.docusign.com/authenticate?goTo=appsAndKeys|Apps and Keys> page',
      required: true,
    }),
    scopes: Property.ShortText({
      displayName: 'scopes',
      required: true,
      description:
        'Comma-separated list of scopes. These represent the OAuth scopes (permissions) that are being requested. For eSignature REST API methods, use the signature scope. The impersonation scope is implied by the JWT Grant operation and does not need to be included. If the access token will be used for other Docusign APIs, additional scopes may be required; see each API’s <https://developers.docusign.com/docs/esign-rest-api/esign101/auth/|authentication> requirements',
    }),
  },
  validate: async ({ auth, server }) => {
    try {
      await createApiClient(auth as DocusignAuthType);
      return {
        valid: true,
      };
    } catch (error) {
      if (
        error instanceof AxiosError &&
        error.response &&
        error.response.status === 400 &&
        error.response.data &&
        error.response.data.error === 'consent_required'
      ) {
        const formattedScopes = auth.scopes.split(',').join(encodeURI(' '));
        const oAuthBasePath =
          auth.environment === 'demo'
            ? 'account-d.docusign.com'
            : 'account.docusign.com';

        // We don't use the built-in getAuthorizationUri method from docusign
        // because it currently limits the scopes that can be requested to signature, extended, and impersonation
        const consentUrl =
          'https://' +
          oAuthBasePath +
          '/oauth/auth' +
          '?response_type=code' +
          '&scope=' +
          formattedScopes +
          '&client_id=' +
          auth.clientId +
          '&redirect_uri=' +
          encodeURIComponent(
            `${server.publicUrl.replace('/api', '')}/redirect`
          );
        return {
          valid: false,
          error:
            'Consent is required, please visit this URL and grant consent: ' +
            consentUrl,
        };
      }
      return {
        valid: false,
        error: 'Invalid connection: ' + error,
      };
    }
  },
});

export type DocusignAuthType = {
  clientId: string;
  privateKey: string;
  environment: 'demo' | 'www' | 'eu';
  impersonatedUserId: string;
  scopes: string;
};

export const docusign = createPiece({
  displayName: 'Docusign',
  auth: docusignAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/docusign.png',
  authors: ['AdamSelene'],
  actions: [
    listEnvelopes,
    getEnvelope,
    getDocument,
    createCustomApiCallAction({
      baseUrl: (auth) => {
        return `https://${
          (auth as DocusignAuthType).environment
        }.docusign.net/restapi`;
      },
      auth: docusignAuth,
      authMapping: async (auth, propsValue) => {
        const apiClient = await createApiClient(auth as DocusignAuthType);
        return (apiClient as any).defaultHeaders;
      },
    }),
  ],
  triggers: [],
});
