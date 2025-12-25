import {
  AppConnectionValueForAuthProperty,
  PieceAuth,
  Property,
} from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { clicdataApiCall } from './client';
import { AppConnectionType } from '@activepieces/shared';

const CLICDATA_SCOPES = [
  'account_read',
  'data_read',
  'data_write',
  'table_read',
  'table_write',
] as const;

export const clicdataAuth = [
  PieceAuth.OAuth2({
    description: 'Connect your ClicData account using OAuth2. Supports both Authorization Code (user-based) and Client Credentials (server-to-server) flows. Configure your preferred flow in ClicData under Account > API Apps.',
    authUrl: 'https://api.clicdata.com/oauth20/authorize',
    tokenUrl: 'https://api.clicdata.com/oauth20/token',
    required: true,
    scope: [...CLICDATA_SCOPES],
    grantType: 'both_client_credentials_and_authorization_code',
    validate: async ({ auth }) => {
      try {
        await clicdataApiCall({
          method: HttpMethod.GET,
          path: '/account',
          auth: {
            type: AppConnectionType.OAUTH2,
            access_token: auth.access_token,
          },
        });
        return { valid: true };
      } catch (e) {
        return {
          valid: false,
          error: (e as Error).message,
        };
      }
    },
  }),
  PieceAuth.SecretText({
    displayName: 'API Key',
    required: true,
    description: 'API key generated in ClicData under Account > API Apps',
    validate: async ({ auth }) => {
      try {
        await clicdataApiCall({
          method: HttpMethod.GET,
          path: '/account',
          auth: {
            type: AppConnectionType.SECRET_TEXT,
            secret_text: auth,
          },
        });
        return { valid: true };
      } catch (e) {
        return {
          valid: false,
          error: (e as Error).message,
        };
      }
    },
  }),
  PieceAuth.CustomAuth({
    displayName: 'Basic Auth',
    description: 'Sign in using your ClicData user credentials (used to build the Basic token).',
    required: true,
    props: {
      clientId: Property.ShortText({
        displayName: 'Client ID',
        required: true,
      }),
      userEmail: Property.ShortText({
        displayName: 'User Email',
        required: true,
      }),
      userPassword: PieceAuth.SecretText({
        displayName: 'User Password',
        required: true,
      }),
    },
    validate: async ({ auth }) => {
      try {
        await clicdataApiCall({
          method: HttpMethod.GET,
          path: '/account',
          auth: {
            type: AppConnectionType.CUSTOM_AUTH,
            props: {
              clientId: auth.clientId,
              userEmail: auth.userEmail,
              userPassword: auth.userPassword,
            },
          },
        });
        return { valid: true };
      } catch (e) {
        return {
          valid: false,
          error: (e as Error).message,
        };
      }
    },
  }),
];

export type ClicdataAuthValue = AppConnectionValueForAuthProperty<
  typeof clicdataAuth
>;
