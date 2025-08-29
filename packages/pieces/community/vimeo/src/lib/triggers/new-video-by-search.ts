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
  query: Property.ShortText({
    displayName: 'Search Query',
    description: 'The search term to monitor for new videos',
    required: true,
  }),
};

const polling: Polling<
  PiecePropValueSchema<typeof vimeoAuth>,
  StaticPropsValue<typeof props>
> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, lastFetchEpochMS, propsValue }) => {
    const { query } = propsValue;
    const videos = await vimeoCommon.searchVideos({ auth, query, sort:'date' });

    // Filter videos modified after the last fetch
    const filteredVideos = videos.filter((video: any) => {
      return (
        video.modified_time &&
        dayjs(video.modified_time).valueOf() > lastFetchEpochMS
      );
    });

    // Use modified_time for deduplication
    return filteredVideos.map((video: any) => ({
      epochMilliSeconds: dayjs(video.modified_time).valueOf(), 
      data: {
        id: video.uri.split('/').pop(),
        title: video.name,
        description: video.description,
        created_time: video.created_time,
        modified_time: video.modified_time,
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

export const newVideoBySearch = createTrigger({
  auth: vimeoAuth,
  name: 'newVideoBySearch',
  displayName: 'New Video By Search',
  description:
    'Triggers when a new Vimeo video matches your specified search query',
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