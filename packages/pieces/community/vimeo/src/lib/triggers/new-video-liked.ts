
import {
  DedupeStrategy,
  Polling,
  pollingHelper,
} from '@activepieces/pieces-common';
import {
  createTrigger,
  PiecePropValueSchema,
  TriggerStrategy,
} from '@activepieces/pieces-framework';
import { vimeoAuth } from '../common/auth';
import { vimeoCommon } from '../common/common';


const polling: Polling<
  PiecePropValueSchema<typeof vimeoAuth>,
  Record<string, never>
> = {
  // Deduplicates new liked videos by ID. The API call uses a fixed 'date' sort (desc)
  // to ensure consistent order for the LAST_ITEM strategy, as 'liked_at' timestamp
  // isn't available for direct time-based filtering.
  strategy: DedupeStrategy.LAST_ITEM,
  items: async ({ auth }) => {
    const likedVideos = await vimeoCommon.getLikedVideos({
      auth,
      sort: 'date',
    });

    return likedVideos.map((video: any) => ({
      id: video.uri.split('/').pop(),
      data: {
        id: video.uri.split('/').pop(),
        title: video.name,
        description: video.description,
        created_time: video.created_time,
        duration: video.duration,
        plays: video.stats?.plays || 0,
        likes: video.metadata?.connections?.likes?.total || 0,
        comments: video.metadata?.connections?.comments?.total || 0,
        link: video.link,
        thumbnail: video.pictures?.base_link,
        user: {
          name: video.user?.name,
          link: video.user?.link,
          uri: video.user?.uri,
        },
        privacy: video.privacy?.view,
        embed: video.privacy?.embed,
        download: video.privacy?.download,
        category: video.category?.name,
        tags: video.tags?.map((tag: any) => tag.name) || [],
        content_rating: video.content_rating || [],
      },
    }));
  },
};

export const newVideoLiked = createTrigger({
  auth: vimeoAuth,
  name: 'newVideoLiked',
  displayName: 'New Video Liked',
  description: 'Triggers when you like a new video on Vimeo',
  props: {},
  sampleData: {},
  type: TriggerStrategy.POLLING,
  async test(context) {
    return await pollingHelper.test(polling, context);
  },
  async onEnable(context) {
    const { store, auth, propsValue } = context;
    await pollingHelper.onEnable(polling, { store, auth, propsValue });
  },

  async onDisable(context) {
    const { store, auth, propsValue } = context;
    await pollingHelper.onDisable(polling, { store, auth, propsValue });
  },

  async run(context) {
    return await pollingHelper.poll(polling, context);
  },
});