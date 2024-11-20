import {
  createPiece,
  PieceAuth,
  Property,
} from '@activepieces/pieces-framework';

import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { PieceCategory } from '@activepieces/shared';
import { createMember } from './lib/actions/create-member';
import { createPost } from './lib/actions/create-post';
import { findMember } from './lib/actions/find-member';
import { findUser } from './lib/actions/find-user';
import { updateMember } from './lib/actions/update-member';
import { common } from './lib/common';
import { memberAdded } from './lib/triggers/member-added';
import { memberDeleted } from './lib/triggers/member-deleted';
import { memberEdited } from './lib/triggers/member-edited';
import { pagePublished } from './lib/triggers/page-published';
import { postPublished } from './lib/triggers/post-published';
import { postScheduled } from './lib/triggers/post-scheduled';

const authMarkdown = `
To generate an API key, follow the steps below in GhostCMS:
1. Go to Settings -> Advanced -> Integrations.
2. Scroll down to Custom Integrations and click Add custom integration.
3. Enter integration name and click create.
4. Copy the API URL and the Admin API Key into the fields below.
`;

export const ghostAuth = PieceAuth.CustomAuth({
  description: authMarkdown,
  required: true,
  props: {
    baseUrl: Property.ShortText({
      displayName: 'API URL',
      description:
        'The API URL of your application (https://test-publication.ghost.io)',
      required: true,
    }),
    apiKey: PieceAuth.SecretText({
      displayName: 'Admin API Key',
      description: 'The admin API key for your application',
      required: true,
    }),
  },
});

export const ghostcms = createPiece({
  displayName: 'GhostCMS',
  description: 'Publishing platform for professional bloggers',

  auth: ghostAuth,
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/ghostcms.png',
  categories: [PieceCategory.MARKETING],
  authors: ["kishanprmr","MoShizzle","abuaboud"],
  actions: [
    createMember,
    updateMember,
    createPost,
    findMember,
    findUser,
    createCustomApiCallAction({
      baseUrl: (auth) =>
        `${(auth as { baseUrl: string }).baseUrl}/ghost/api/admin`,
      auth: ghostAuth,
      authMapping: async (auth) => ({
        Authorization: `Ghost ${common.jwtFromApiKey(
          (auth as { apiKey: string }).apiKey
        )}`,
      }),
    }),
  ],
  triggers: [
    memberAdded,
    memberEdited,
    memberDeleted,
    postPublished,
    postScheduled,
    pagePublished,
  ],
});
