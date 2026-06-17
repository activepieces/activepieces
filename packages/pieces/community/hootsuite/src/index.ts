import { createPiece } from '@activepieces/pieces-framework';
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { OAuth2PropertyValue } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { createMessageAction } from './lib/actions/create-message';
import { getMessageAction } from './lib/actions/get-message';
import { deleteMessageAction } from './lib/actions/delete-message';
import { newScheduledPostTrigger } from './lib/triggers/new-scheduled-post';
import { newPublishedPostTrigger } from './lib/triggers/new-published-post';
import { hootsuiteAuth } from './lib/auth';

export const hootsuite = createPiece({
  displayName: 'Hootsuite',
  description: 'Social media management — schedule posts and manage multiple networks from one dashboard.',
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/hootsuite.png',
  categories: [PieceCategory.MARKETING],
  auth: hootsuiteAuth,
  authors: ['onyedikachi-david'],
  actions: [
    createMessageAction,
    getMessageAction,
    deleteMessageAction,
    createCustomApiCallAction({
      baseUrl: () => 'https://platform.hootsuite.com/v1',
      auth: hootsuiteAuth,
      authMapping: async (auth) => ({
        Authorization: `Bearer ${(auth as OAuth2PropertyValue).access_token}`,
      }),
    }),
  ],
  triggers: [newScheduledPostTrigger, newPublishedPostTrigger],
});

export { hootsuiteAuth };
