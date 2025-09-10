import { PieceAuth } from '@activepieces/pieces-framework';
import { lemlistApiService } from './requests';

export const BASE_URL = 'https://api.lemlist.com/api';

export const lemlistAuth = PieceAuth.SecretText({
  displayName: 'Lemlist API Key',
  description: 'Enter your Lemlist API key',
  required: true,
  validate: async ({ auth }) => {
    try {
      await lemlistApiService.fetchTeams(auth).catch((err) => {
        throw err;
      });

      return {
        valid: true,
      };
    } catch (e: any) {
      return {
        valid: false,
        error: `Auth validation error: ${e.message}`,
      };
    }
  },
});

export const API_ENDPOINTS = {
  TEAM: '/team',
  HOOKS: '/hooks',
  CAMPAIGNS: '/campaigns',
  LEADS: '/leads',
  UNSUBSCRIBES: '/unsubscribes',
};
