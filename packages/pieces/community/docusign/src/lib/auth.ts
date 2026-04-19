import { PieceAuth, Property } from '@activepieces/pieces-framework';
import { AppConnectionType } from '@activepieces/shared';
import { createApiClient } from './common';

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
        "Comma-separated list of scopes. These represent the OAuth scopes (permissions) that are being requested. For eSignature REST API methods, use the signature scope. The impersonation scope is implied by the JWT Grant operation and does not need to be included. If the access token will be used for other Docusign APIs, additional scopes may be required; see each API's <https://developers.docusign.com/docs/esign-rest-api/esign101/auth/|authentication> requirements",
    }),
  },
  validate: async ({ auth, server }) => {
    try {
      await createApiClient({
        props: auth,
        type: AppConnectionType.CUSTOM_AUTH,
      });
      return { valid: true };
    } catch (error) {
      // Use duck-typing instead of instanceof — the DocuSign SDK bundles its own
      // copy of axios, so instanceof AxiosError returns false even for axios errors.
      const httpError = error as {
        response?: {
          status?: number;
          data?: { error?: string; error_description?: string };
        };
      };
      const status = httpError.response?.status;
      const docusignError = httpError.response?.data?.error;
      const docusignDesc = httpError.response?.data?.error_description;

      if (status === 400) {
        if (docusignError && docusignError !== 'consent_required') {
          return {
            valid: false,
            error: `DocuSign error: ${docusignError}${
              docusignDesc ? ` — ${docusignDesc}` : ''
            }`,
          };
        }

        // impersonation must always be in the consent URL for JWT grant to work,
        // even if the user didn't include it in their scopes field.
        const scopeSet = new Set([
          ...auth.scopes.split(',').map((s) => s.trim()),
          'impersonation',
        ]);
        const scopes = [...scopeSet].join('%20');
        const oAuthBasePath =
          auth.environment === 'demo'
            ? 'account-d.docusign.com'
            : 'account.docusign.com';
        const consentUrl =
          `https://${oAuthBasePath}/oauth/auth` +
          `?response_type=code` +
          `&scope=${scopes}` +
          `&client_id=${auth.clientId}` +
          `&redirect_uri=${`${server.publicUrl.replace('/api', '')}/redirect`}`;

        return {
          valid: false,
          error:
            'Consent is required. Please visit this URL to grant access, then try again: ' +
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
