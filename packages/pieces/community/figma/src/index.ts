import { createCustomApiCallAction } from '@activepieces/pieces-common';
import {
  OAuth2PropertyValue,
  PieceAuth,
  createPiece,
} from '@activepieces/pieces-framework';
import { getCommentsAction } from './lib/actions/get-comments-action';
import { getFileAction } from './lib/actions/get-file-action';
import { postCommentAction } from './lib/actions/post-comment-action';
import { newCommentTrigger } from './lib/trigger/new-comment';

export const figmaAuth = PieceAuth.OAuth2({
  description: '',
  authUrl: 'https://www.figma.com/oauth',
  tokenUrl: 'https://www.figma.com/api/oauth/token',
  required: true,
  scope: ['file_read'],
});

export const figma = createPiece({
  displayName: 'Figma',
  description: 'Collaborative interface design tool',
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/figma.png',
  categories: [],
  authors: ["kishanprmr","MoShizzle","khaledmashaly","abuaboud"],
  auth: figmaAuth,
  actions: [
    getFileAction,
    getCommentsAction,
    postCommentAction,
    createCustomApiCallAction({
      baseUrl: () => 'https://api.figma.com',
      auth: figmaAuth,
      authMapping: async (auth) => ({
        Authorization: `Bearer ${(auth as OAuth2PropertyValue).access_token}`,
      }),
    }),
  ],
  triggers: [newCommentTrigger],
});
