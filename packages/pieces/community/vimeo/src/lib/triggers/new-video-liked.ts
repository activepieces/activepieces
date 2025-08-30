import { PiecePropValueSchema, createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { vimeoAuth } from '../auth';
import { apiRequest } from '../common';
import { DedupeStrategy, Polling, pollingHelper, HttpMethod } from '@activepieces/pieces-common';

const polling: Polling<PiecePropValueSchema<typeof vimeoAuth>, object> = {
  strategy: DedupeStrategy.LAST_ITEM,
  async items({ auth, lastItemId }) {
    const response = await apiRequest({
      auth,
      path: '/me/likes',
      method: HttpMethod.GET,
      queryParams: {
        per_page: '50',
      },
    });

    const likedVideos = response.body.data || [];
    const newVideos = [];

    for (const video of likedVideos) {
      const videoId = video.uri.split('/').pop();

      if(videoId === lastItemId) break;

      newVideos.push(video);
      video.video_id = videoId;
    }

    return newVideos.map((video) => ({
      id: video.uri.split('/').pop(),
      data: video,
    }));
  },
};

export const newVideoLiked = createTrigger({
  name: 'new_video_liked',
  displayName: 'New Video I\'ve Liked',
  description: 'Triggers when you like a new video on Vimeo',
  auth: vimeoAuth,
  props: {
  },
  type: TriggerStrategy.POLLING,
  async onEnable(context) {
    await pollingHelper.onEnable(polling, {
      auth: context.auth,
      store: context.store,
      propsValue: context.propsValue,
    });
  },
  async onDisable(context) {
    await pollingHelper.onDisable(polling, {
      auth: context.auth,
      store: context.store,
      propsValue: context.propsValue,
    });
  },
  async test(context) {
    return await pollingHelper.test(polling, context);
  },
  async run(context) {
    return await pollingHelper.poll(polling, context);
  },
  sampleData: {},
});
