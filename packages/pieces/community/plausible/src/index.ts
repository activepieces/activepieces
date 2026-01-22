import {
  AuthenticationType,
  HttpMethod,
  httpClient,
} from '@activepieces/pieces-common';
import { PieceAuth, createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { plausibleCommon } from './lib/common';
import { listTeams } from './lib/actions/list-teams';
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

export const plausibleAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: `To get your API key:
1. Log in to your Plausible Analytics account
2. Click your account name in the top-right menu and go to **Settings**
3. Go to **API Keys** in the left sidebar
4. Click **New API Key**, choose **Sites API**, and save the key`,
  required: true,
  validate: async ({ auth }) => {
    try {
      await httpClient.sendRequest({
        url: `${plausibleCommon.baseUrl}/sites`,
        method: HttpMethod.GET,
        authentication: {
          type: AuthenticationType.BEARER_TOKEN,
          token: auth,
        },
      });
      return {
        valid: true,
      };
    } catch (e) {
      return {
        valid: false,
        error: 'Invalid API key',
      };
    }
  },
});

export const plausible = createPiece({
  displayName: 'Plausible',
  description: 'Privacy-friendly web analytics',
  auth: plausibleAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/plausible.png',
  authors: ['onyedikachi-david'],
  actions: [
    listTeams,
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
  ],
  triggers: [],
  categories: [PieceCategory.MARKETING],
});