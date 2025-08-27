import { OAuth2PropertyValue } from '@activepieces/pieces-framework';
import { Vimeo } from '@vimeo/vimeo';

export type authProps = { auth: OAuth2PropertyValue };

type SearchVideosProps = authProps & {
  query: string;
  sort: string;
};

type GetUserVideosProps = authProps & {
  userId: string;
  sort: string;
};

type GetLikedVideosProps = authProps & {
  sort: string;
};

type GetMyVideosProps = authProps & {
  sort: string;
};


export const vimeoCommon = {
  // Initialize Vimeo client
  getClient: ({ auth }: authProps) => {
    return new Vimeo('', '', auth.access_token);
  },

  // Get user's liked videos
  getLikedVideos: async ({ auth, sort }: GetLikedVideosProps) => {
    const client = vimeoCommon.getClient({ auth });
    const response = await client.request({
      method: 'GET',
      path: '/me/likes',
      query: { sort, direction: 'desc', per_page: 50 },
    });
    return response.body.data;
  },

  // Get videos by search
  searchVideos: async ({ auth, query, sort }: SearchVideosProps) => {
    const client = vimeoCommon.getClient({ auth });
    const response = await client.request({
      method: 'GET',
      path: '/videos',
      query: { query, sort, direction: 'desc', per_page: 50 },
    });
    return response.body.data;
  },

  // Get user's videos
  getMyVideos: async ({ auth, sort}: GetMyVideosProps) => {
    const client = vimeoCommon.getClient({ auth });
    const response = await client.request({
      method: 'GET',
      path: '/me/videos',
      query: { sort, direction: 'desc', per_page: 50 },
    });
    return response.body.data;
  },

  // Get videos by user
  getUserVideos: async ({ auth, userId, sort }: GetUserVideosProps) => {
    const client = vimeoCommon.getClient({ auth });
    const response = await client.request({
      method: 'GET',
      path: `/users/${userId}/videos`,
      query: { sort, direction: 'desc', per_page: 50 },
    });
    return response.body.data;
  },
};
