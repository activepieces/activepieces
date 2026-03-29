import {
  createPiece,
  PieceAuth,
  Property,
} from '@activepieces/pieces-framework';
import {
  createCustomApiCallAction,
  HttpMethod,
  httpClient,
} from '@activepieces/pieces-common';
import { PieceCategory } from '@activepieces/shared';
import { createPost } from './lib/actions/create-post';
import { listPosts } from './lib/actions/list-posts';
import { deletePost } from './lib/actions/delete-post';
import { listIntegrations } from './lib/actions/list-integrations';
import { findAvailableSlot } from './lib/actions/find-available-slot';
import { getPlatformAnalytics } from './lib/actions/get-platform-analytics';
import { getPostAnalytics } from './lib/actions/get-post-analytics';
import { uploadFileFromUrl } from './lib/actions/upload-file-from-url';
import { newPost } from './lib/triggers/new-post';

export const postizAuth = PieceAuth.CustomAuth({
  displayName: 'Postiz Connection',
  required: true,
  props: {
    base_url: Property.ShortText({
      displayName: 'Base URL',
      description:
        'The API base URL. Use `https://api.postiz.com/public/v1` for Postiz Cloud, or `https://your-domain.com/api/public/v1` for self-hosted instances.',
      required: true,
      defaultValue: 'https://api.postiz.com/public/v1',
    }),
    api_key: PieceAuth.SecretText({
      displayName: 'API Key',
      description: `To get your API key:
1. Log in to your Postiz dashboard
2. Go to **Settings > Developers > Public API**
3. Generate a new API key and copy it`,
      required: true,
    }),
  },
  validate: async ({ auth }) => {
    try {
      const baseUrl = auth.base_url?.trim().replace(/\/+$/, '');
      await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: `${baseUrl}/is-connected`,
        headers: {
          Authorization: auth.api_key,
        },
      });
      return { valid: true };
    } catch {
      return {
        valid: false,
        error: 'Invalid API key or base URL. Please check your credentials.',
      };
    }
  },
});

export const postiz = createPiece({
  displayName: 'Postiz',
  description:
    'Open-source social media scheduling tool supporting 30+ platforms',
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/postiz.png',
  categories: [PieceCategory.MARKETING],
  auth: postizAuth,
  authors: ['bst1n'],
  actions: [
    createPost,
    listPosts,
    deletePost,
    listIntegrations,
    findAvailableSlot,
    getPlatformAnalytics,
    getPostAnalytics,
    uploadFileFromUrl,
    createCustomApiCallAction({
      baseUrl: (auth) =>
        (auth as { props: { base_url: string } }).props.base_url
          ?.trim()
          .replace(/\/+$/, ''),
      auth: postizAuth,
      authMapping: async (auth) => ({
        Authorization: (auth as { props: { api_key: string } }).props.api_key,
      }),
    }),
  ],
  triggers: [newPost],
});
