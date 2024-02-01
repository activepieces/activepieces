import {
  createPiece,
  PieceAuth,
  Property,
} from '@activepieces/pieces-framework';

import { memberAdded } from './lib/triggers/member-added';
import { memberEdited } from './lib/triggers/member-edited';
import { memberDeleted } from './lib/triggers/member-deleted';
import { postPublished } from './lib/triggers/post-published';
import { postScheduled } from './lib/triggers/post-scheduled';
import { pagePublished } from './lib/triggers/page-published';
import { createMember } from './lib/actions/create-member';
import { updateMember } from './lib/actions/update-member';
import { findMember } from './lib/actions/find-member';
import { createPost } from './lib/actions/create-post';
import { findUser } from './lib/actions/find-user';
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { common } from './lib/common';

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
  auth: ghostAuth,
  minimumSupportedRelease: '0.5.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/ghostcms.png',
  authors: ['MoShizzle'],
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
      authMapping: (auth) => ({
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
