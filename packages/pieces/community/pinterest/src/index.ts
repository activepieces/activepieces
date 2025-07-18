import { createPiece, OAuth2PropertyValue } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { pinterestAuth } from './lib/common/auth';
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createBoardAction } from './lib/actions/create-board';
import { createPinAction } from './lib/actions/create-pin';
import { deletePinAction } from './lib/actions/delete-pin';
import { findBoardByNameAction } from './lib/actions/find-board-by-name';
import { findPinByTitleAction } from './lib/actions/find-pin';
import { updateBoardAction } from './lib/actions/update-board';
import { newBoardCreatedTrigger } from './lib/triggers/new-board-created';
import { newFollowerTrigger } from './lib/triggers/new-follower';
import { newPinOnBoardTrigger } from './lib/triggers/new-pin-on-board';

export const pinterest = createPiece({
  displayName: 'Pinterest',
  auth: pinterestAuth,
  description: 'Interact with Pinterest API to manage boards and pins.',
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/pinterest.png',
  authors: ['aryel780'],
  categories: [PieceCategory.MARKETING],
  actions: [
    createBoardAction,
    createPinAction,
    deletePinAction,
    findBoardByNameAction,
    findPinByTitleAction,
    updateBoardAction,
    createCustomApiCallAction({
      auth: pinterestAuth,
      baseUrl: () => `https://api.pinterest.com/v5`,
      authMapping: async (auth) => ({
        Authorization: `Bearer ${(auth as OAuth2PropertyValue).access_token}`,
      }),
    }),
  ],
  triggers: [newBoardCreatedTrigger, newFollowerTrigger, newPinOnBoardTrigger],
});
