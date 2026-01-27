import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { oktaAuth } from './lib/common/common';
import { createUserAction } from './lib/actions/create-user';
import { activateUserAction } from './lib/actions/activate-user';
import { deactivateUserAction } from './lib/actions/deactivate-user';
import { suspendUserAction } from './lib/actions/suspend-user';
import { addUserToGroupAction } from './lib/actions/add-user-to-group';
import { removeUserFromGroupAction } from './lib/actions/remove-user-from-group';
import { updateUserAction } from './lib/actions/update-user';
import { findUserByEmailAction } from './lib/actions/find-user-by-email';
import { findGroupByNameAction } from './lib/actions/find-group-by-name';
import { newEventTrigger } from './lib/triggers/new-event';
import { createCustomApiCallAction } from '@activepieces/pieces-common';

export const okta = createPiece({
  displayName: 'Okta',
  auth: oktaAuth,
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/okta.png',
  authors: ['Ani-4x', 'sanket-a11y'],
  categories: [PieceCategory.PRODUCTIVITY],
  actions: [
    createUserAction,
    activateUserAction,
    deactivateUserAction,
    suspendUserAction,
    addUserToGroupAction,
    removeUserFromGroupAction,
    updateUserAction,
    findUserByEmailAction,
    findGroupByNameAction,
    createCustomApiCallAction({
      baseUrl: (auth) => `${(auth)?.props.domain}/api/v1`,
      auth: oktaAuth,
      authMapping: async (auth) => ({
        Authorization: `SSWS ${(auth).props.apiToken}`,
      }),
    }),
  ],
  triggers: [newEventTrigger],
});
