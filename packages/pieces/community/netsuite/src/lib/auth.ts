import {
  AppConnectionValueForAuthProperty,
  PieceAuth,
  Property,
} from '@activepieces/pieces-framework';
import { requestNetSuiteM2MAccessToken } from './common/jwt-assertion';

const DEFAULT_M2M_SCOPE = 'rest_webservices';

// NetSuite Token-Based Authentication (TBA) setup - Setup > Integration > Manage Integrations:
// https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/section_161100716589.html
const tbaAuth = PieceAuth.CustomAuth({
  displayName: 'Token-Based Authentication (TBA)',
  required: true,
  props: {
    accountId: Property.ShortText({
      displayName: 'Account ID',
      required: true,
      description: 'Your NetSuite account ID',
    }),
    consumerKey: Property.ShortText({
      displayName: 'Consumer Key',
      required: true,
      description: 'Your NetSuite consumer key',
    }),
    consumerSecret: PieceAuth.SecretText({
      displayName: 'Consumer Secret',
      required: true,
      description: 'Your NetSuite consumer secret',
    }),
    tokenId: Property.ShortText({
      displayName: 'Token ID',
      required: true,
      description: 'Your NetSuite token ID',
    }),
    tokenSecret: PieceAuth.SecretText({
      displayName: 'Token Secret',
      required: true,
      description: 'Your NetSuite token secret',
    }),
  },
});

// NetSuite OAuth 2.0 Client Credentials (M2M) setup - Setup > Integration > OAuth 2.0
// Client Credentials (M2M) Setup, mapping a certificate to an integration + role:
// https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/section_162730264820.html
const m2mAuth = PieceAuth.CustomAuth({
  displayName: 'OAuth 2.0 Client Credentials (M2M)',
  description:
    'Machine-to-machine OAuth 2.0 using a certificate-signed JWT client assertion. Required for tenants onboarded after NetSuite 2027.1, since new Token-Based Authentication (TBA) integrations can no longer be created from that release onward.',
  required: true,
  props: {
    accountId: Property.ShortText({
      displayName: 'Account ID',
      required: true,
      description: 'Your NetSuite account ID',
    }),
    clientId: Property.ShortText({
      displayName: 'Client ID',
      required: true,
      description:
        'The Client ID (Integration ID) of the integration record configured for OAuth 2.0 Client Credentials.',
    }),
    certificateId: Property.ShortText({
      displayName: 'Certificate ID (kid)',
      required: true,
      description:
        'The Certificate ID generated when the public certificate was mapped to this integration under OAuth 2.0 Client Credentials (M2M) Setup.',
    }),
    privateKey: PieceAuth.SecretText({
      displayName: 'Private Key',
      required: true,
      description:
        'The PEM-encoded private key matching the certificate uploaded to NetSuite (paste the contents of the key file).',
    }),
    scope: Property.ShortText({
      displayName: 'Scope',
      required: false,
      description:
        'Space-separated scopes to request (e.g. "rest_webservices" or "rest_webservices restlets"). Defaults to "rest_webservices".',
    }),
  },
  validate: async ({ auth }) => {
    try {
      await requestNetSuiteM2MAccessToken({
        accountId: auth.accountId,
        clientId: auth.clientId,
        certificateId: auth.certificateId,
        privateKey: auth.privateKey,
        scope: auth.scope?.trim() || DEFAULT_M2M_SCOPE,
      });
      return { valid: true };
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      return {
        valid: false,
        error: `Could not obtain an access token: ${message}. Verify the Account ID, Client ID, Certificate ID and private key match the integration's OAuth 2.0 Client Credentials (M2M) mapping in NetSuite.`,
      };
    }
  },
  refresh: {
    generate: async ({ auth }) => {
      const { access_token, expires_in } = await requestNetSuiteM2MAccessToken({
        accountId: auth.accountId,
        clientId: auth.clientId,
        certificateId: auth.certificateId,
        privateKey: auth.privateKey,
        scope: auth.scope?.trim() || DEFAULT_M2M_SCOPE,
      });
      return { access_token, expires_in };
    },
    defaultExpiresIn: 3300,
  },
});

export const netsuiteAuth = [tbaAuth, m2mAuth];

export type NetSuiteAuthValue = AppConnectionValueForAuthProperty<
  typeof netsuiteAuth
>;

export function isM2MAuth(
  auth: NetSuiteAuthValue
): auth is Extract<NetSuiteAuthValue, { props: { clientId: string } }> {
  return 'clientId' in auth.props;
}
