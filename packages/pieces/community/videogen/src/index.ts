import { createPiece, PieceCategory } from '@activepieces/pieces-framework';
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { videogenAuth } from './lib/auth';
import { startStoryboard } from './lib/actions/start-storyboard';
import { getStatus } from './lib/actions/get-status';
import { getAccount } from './lib/actions/get-account';

export const videogen = createPiece({
  displayName: 'VideoGen',
  description: 'Generate product videos from storyboards and retrieve finished MP4 exports. https://videogen.io/videogen-mcp',
  auth: videogenAuth,
  minimumSupportedRelease: '0.82.0',
  logoUrl: 'https://huggingface.co/spaces/video-gen/videogen-video-workflow-builder/resolve/main/logo.png',
  authors: ['dg314'],
  categories: [PieceCategory.ARTIFICIAL_INTELLIGENCE],
  actions: [startStoryboard, getStatus, getAccount, createCustomApiCallAction({
    baseUrl: () => 'https://api.videogen.io/v1',
    auth: videogenAuth,
    authMapping: async (auth) => ({Authorization: `Bearer ${auth.secret_text}`}),
  })],
  triggers: [],
});
