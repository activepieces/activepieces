import {
  AuthenticationType,
  createCustomApiCallAction,
  httpClient,
  HttpMethod,
} from '@activepieces/pieces-common';
import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { copyMediaAction } from './lib/actions/copy-media';
import { createProjectAction } from './lib/actions/create-project';
import { deleteMediaAction } from './lib/actions/delete-media';
import { findMediaAction } from './lib/actions/find-media';
import { getMediaAction } from './lib/actions/get-media';
import { updateMediaAction } from './lib/actions/update-media';
import { updateProjectAction } from './lib/actions/update-project';
import { newMediaTrigger } from './lib/triggers/new-media';
import { newProjectTrigger } from './lib/triggers/new-project';

export const wistiaAuth = PieceAuth.SecretText({
  displayName: 'API Access Token',
  description: `To get your Wistia API access token:
1. Log in to your Wistia account.
2. Go to **Account Settings > API Access** (or visit https://my.wistia.com/account/api).
3. Click **Create Token** and give it a name.
4. Grant it the permissions you need (read/update/delete) and copy the token — it is only shown once.
5. Paste the token below.`,
  required: true,
  validate: async ({ auth }) => {
    try {
      await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: 'https://api.wistia.com/v1/projects.json',
        authentication: {
          type: AuthenticationType.BEARER_TOKEN,
          token: auth,
        },
        queryParams: { per_page: '1' },
      });
      return { valid: true };
    } catch (e) {
      return {
        valid: false,
        error: 'Invalid API access token. Please check your token and try again.',
      };
    }
  },
});

export const wistia = createPiece({
  displayName: 'Wistia',
  description: 'Video hosting and analytics for business. Manage your projects and media library.',
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/wistia.png',
  categories: [PieceCategory.MARKETING, PieceCategory.CONTENT_AND_FILES],
  auth: wistiaAuth,
  authors: ['sanket-a11y'],
  actions: [
    createProjectAction,
    updateProjectAction,
    getMediaAction,
    findMediaAction,
    updateMediaAction,
    copyMediaAction,
    deleteMediaAction,
    createCustomApiCallAction({
      baseUrl: () => 'https://api.wistia.com/v1',
      auth: wistiaAuth,
      authMapping: async (auth) => ({
        Authorization: `Bearer ${(auth as { secret_text: string }).secret_text}`,
      }),
    }),
  ],
  triggers: [newMediaTrigger, newProjectTrigger],
});
