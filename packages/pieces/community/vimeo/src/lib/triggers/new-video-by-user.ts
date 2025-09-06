
import {
  DedupeStrategy,
  Polling,
  pollingHelper,
} from '@activepieces/pieces-common';
import {
  createTrigger,
  PiecePropValueSchema,
  TriggerStrategy,
  Property,
  StaticPropsValue,
} from '@activepieces/pieces-framework';
import dayjs from 'dayjs';
import { vimeoAuth } from '../common/auth';
import { vimeoCommon } from '../common/common';

const props = {
  userId: Property.ShortText({
    displayName: 'User ID',
    description: 'The Vimeo user ID to monitor for new videos',
    required: true,
  }),
};

const polling: Polling<
  PiecePropValueSchema<typeof vimeoAuth>,
  StaticPropsValue<typeof props>
> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, lastFetchEpochMS, propsValue }) => {
    const { userId} = propsValue;
    const videos = await vimeoCommon.getUserVideos({ auth, userId, sort: 'date' });

    // Filter videos created after the last fetch
    const filteredVideos = videos.filter((video: any) => {
      return (
        video.created_time &&
        dayjs(video.created_time).valueOf() > lastFetchEpochMS
      );
    });

    // Use created_time for deduplication
    return filteredVideos.map((video: any) => ({
      epochMilliSeconds: dayjs(video.created_time).valueOf(), // Use created_time for deduplication
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

export const newVideoByUser = createTrigger({
  auth: vimeoAuth,
  name: 'newVideoByUser',
  displayName: 'New Video by User',
  description: 'Triggers when a specified Vimeo user publishes a new video',
  props: props,
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