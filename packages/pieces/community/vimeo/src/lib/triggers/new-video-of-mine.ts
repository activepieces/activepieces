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
import dayjs from 'dayjs';
import { vimeoAuth } from '../common/auth';
import { vimeoCommon } from '../common/common';

const polling: Polling<
  PiecePropValueSchema<typeof vimeoAuth>,
  Record<string, never>
> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, lastFetchEpochMS }) => {
    const videos = await vimeoCommon.getMyVideos({ auth, sort:'date' });

    const filteredVideos = videos.filter((video: any) => {
      return (
        video.created_time &&
        dayjs(video.created_time).valueOf() > lastFetchEpochMS
      );
    });

    // Use created_time for deduplication
    return filteredVideos.map((video: any) => ({
      epochMilliSeconds: dayjs(video.created_time).valueOf(),
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

export const newVideoOfMine = createTrigger({
  auth: vimeoAuth,
  name: 'newVideoOfMine',
  displayName: 'New Video of Mine',
  description: 'Triggers when you upload a new video to your Vimeo account',
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
