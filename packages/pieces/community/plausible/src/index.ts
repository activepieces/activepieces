import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import {
  createCustomApiCallAction,
  AuthenticationType,
  HttpMethod,
  httpClient,
} from '@activepieces/pieces-common';
import { PieceCategory } from '@activepieces/shared';
import { getRealtimeVisitors } from './lib/actions/get-realtime-visitors.action';
import { getAggregateStats } from './lib/actions/get-aggregate-stats.action';
import { getBreakdown } from './lib/actions/get-breakdown.action';
import { listSites } from './lib/actions/list-sites';
import { getSite } from './lib/actions/get-site';
import { createSite } from './lib/actions/create-site';
import { updateSite } from './lib/actions/update-site';
import { deleteSite } from './lib/actions/delete-site';
import { createSharedLink } from './lib/actions/create-shared-link';
import { listGoals } from './lib/actions/list-goals';
import { createGoal } from './lib/actions/create-goal';
import { deleteGoal } from './lib/actions/delete-goal';
import { listCustomProperties } from './lib/actions/list-custom-properties';
import { createCustomProperty } from './lib/actions/create-custom-property';
import { deleteCustomProperty } from './lib/actions/delete-custom-property';
import { listGuests } from './lib/actions/list-guests';
import { inviteGuest } from './lib/actions/invite-guest';
import { removeGuest } from './lib/actions/remove-guest';
import { listTeams } from './lib/actions/list-teams';
import { trafficSpike } from './lib/triggers/traffic-spike.trigger';

const BASE_URL = 'https://plausible.io/api/v1';

export const plausibleAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: `To get your API key:
1. Log in to your Plausible Analytics account
2. Click your account name in the top-right menu and go to **Settings**
3. Go to **API Keys** in the left sidebar
4. Click **New API Key**, choose **Stats API** or **Sites API**, and save the key`,
  required: true,
  validate: async ({ auth }) => {
    try {
      await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: `${BASE_URL}/sites`,
        authentication: {
          type: AuthenticationType.BEARER_TOKEN,
          token: auth,
        },
      });
      return { valid: true };
    } catch {
      return { valid: false, error: 'Invalid API key. Please check your Plausible API key.' };
    }
  },
});

export const plausible = createPiece({
  displayName: 'Plausible Analytics',
  description: 'Privacy-friendly website analytics',
  auth: plausibleAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/plausible.png',
  categories: [PieceCategory.MARKETING],
  authors: ['Tosh94'],
  actions: [
    getRealtimeVisitors,
    getAggregateStats,
    getBreakdown,
    listSites,
    getSite,
    createSite,
    updateSite,
    deleteSite,
    createSharedLink,
    listGoals,
    createGoal,
    deleteGoal,
    listCustomProperties,
    createCustomProperty,
    deleteCustomProperty,
    listGuests,
    inviteGuest,
    removeGuest,
    listTeams,
    createCustomApiCallAction({
      baseUrl: () => BASE_URL,
      auth: plausibleAuth,
      authMapping: async (auth) => ({
        Authorization: `Bearer ${(auth as { secret_text: string }).secret_text}`,
      }),
    }),
  ],
  triggers: [trafficSpike],
});
