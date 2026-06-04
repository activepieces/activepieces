import { createPiece } from '@activepieces/pieces-framework';
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { PieceCategory } from '@activepieces/shared';
import { teamhoodAuth, TeamhoodAuth } from './lib/common';
import { createItemAction } from './lib/actions/create-item';
import { updateItemAction } from './lib/actions/update-item';
import { getItemAction } from './lib/actions/get-item';
import { deleteItemAction } from './lib/actions/delete-item';
import { findItemsAction } from './lib/actions/find-items';
import { createRowAction } from './lib/actions/create-row';
import { listUsersAction } from './lib/actions/list-users';
import { newItemTrigger } from './lib/triggers/new-item';
import { updatedItemTrigger } from './lib/triggers/updated-item';
import { completedItemTrigger } from './lib/triggers/completed-item';

export { teamhoodAuth } from './lib/common';

export const teamhood = createPiece({
  displayName: 'Teamhood',
  description:
    'Visual project management for boards, tasks, and timelogs in Teamhood.',
  auth: teamhoodAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/teamhood.png',
  categories: [PieceCategory.PRODUCTIVITY],
  authors: ['sanket-a11y'],
  actions: [
    createItemAction,
    updateItemAction,
    getItemAction,
    deleteItemAction,
    findItemsAction,
    createRowAction,
    listUsersAction,
    createCustomApiCallAction({
      baseUrl: (auth) => {
        const a = auth?.props as TeamhoodAuth;
        return `${a.baseUrl.replace(/\/+$/, '')}/api/v1`;
      },
      auth: teamhoodAuth,
      authMapping: async (auth) => {
        const a = auth?.props as TeamhoodAuth;
        return { 'X-ApiKey': a.apiKey };
      },
    }),
  ],
  triggers: [newItemTrigger, updatedItemTrigger, completedItemTrigger],
});
