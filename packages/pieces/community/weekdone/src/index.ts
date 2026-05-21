import { createPiece, OAuth2PropertyValue } from '@activepieces/pieces-framework';
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { PieceCategory } from '@activepieces/shared';
import { weekdoneAuth } from './lib/auth';
import { createItemAction } from './lib/actions/create-item';
import { updateItemAction } from './lib/actions/update-item';
import { createObjectiveAction } from './lib/actions/create-objective';
import { updateObjectiveAction } from './lib/actions/update-objective';
import { newItemTrigger } from './lib/triggers/new-item';
import { newObjectiveTrigger } from './lib/triggers/new-objective';

export const weekdone = createPiece({
  displayName: 'Weekdone',
  description: 'OKR & weekly status reporting tool for teams.',
  auth: weekdoneAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/weekdone.png',
  categories: [PieceCategory.PRODUCTIVITY],
  authors: ['onyedikachi-david'],
  actions: [
    createItemAction,
    updateItemAction,
    createObjectiveAction,
    updateObjectiveAction,
    createCustomApiCallAction({
      baseUrl: () => 'https://api.weekdone.com/1',
      auth: weekdoneAuth,
      authMapping: async (auth) => ({
        token: (auth as OAuth2PropertyValue).access_token,
      }),
      authLocation: 'queryParams',
    }),
  ],
  triggers: [newItemTrigger, newObjectiveTrigger],
});

