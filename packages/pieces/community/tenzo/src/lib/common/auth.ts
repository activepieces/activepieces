import {
  AppConnectionValueForAuthProperty,
  PieceAuth,
  Property,
} from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { tenzoApiCall } from './client';
import { AppConnectionType } from '@activepieces/shared';

const TENZO_SCOPES = [
  'tenzo/area:read',
  'tenzo/location:read',
  'tenzo/sales:read',
  'tenzo/sales/day:read',
  'tenzo/sales/day/location:read',
  'tenzo/sales/day/area:read',
  'tenzo/sales/product:read',
  'tenzo/sales/product/category:read',
  'tenzo/sales/product/item:read',
  'tenzo/sales/product/location:read',
  'tenzo/sales/product/area:read',
  'tenzo/sales/order:read',
  'tenzo/sales/order/location:read',
  'tenzo/sales/order/area:read',
  'tenzo/sales/time_of_day:read',
  'tenzo/sales/time_of_day/location:read',
  'tenzo/sales/time_of_day/area:read',
  'tenzo/forecast:read',
  'tenzo/forecast/day/location:read',
  'tenzo/forecast/time_of_day/location:read',
  'tenzo/forecast/product/location:read',
  'tenzo/schedule/calendar:read',
  'tenzo/schedule/calendar:write',
  'tenzo/schedule/event:read',
  'tenzo/schedule/event:write',
  'tenzo/analytics:read',
] as const;

export const tenzoAuth = [
  PieceAuth.OAuth2({
    description: 'Connect your Tenzo account using OAuth2. Supports both Authorization Code and Client Credentials flows.',
    authUrl: 'https://auth.gotenzo.com/o/authorize/',
    tokenUrl: 'https://auth.gotenzo.com/o/token/',
    required: true,
    scope: [...TENZO_SCOPES],
    grantType: 'both_client_credentials_and_authorization_code',
    validate: async ({ auth }) => {
      try {
        await tenzoApiCall({
          method: HttpMethod.GET,
          path: '/areas/',
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
    description: 'API Key for Tenzo. Use "Token" prefix authentication method.',
    validate: async ({ auth }) => {
      try {
        await tenzoApiCall({
          method: HttpMethod.GET,
          path: '/areas/',
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
    displayName: 'App Credentials',
    description: 'Use Application ID and API Secret Key for authentication.',
    required: true,
    props: {
      appId: Property.ShortText({
        displayName: 'Application ID',
        required: true,
      }),
      apiSecret: PieceAuth.SecretText({
        displayName: 'API Secret Key',
        required: true,
      }),
    },
    validate: async ({ auth }) => {
      try {
        await tenzoApiCall({
          method: HttpMethod.GET,
          path: '/areas/',
          auth: {
            type: AppConnectionType.CUSTOM_AUTH,
            props: {
              appId: auth.appId,
              apiSecret: auth.apiSecret,
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

export type TenzoAuthValue = AppConnectionValueForAuthProperty<
  typeof tenzoAuth
>;
