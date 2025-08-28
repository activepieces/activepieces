import { PiecePropValueSchema, createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { vimeoAuth } from '../auth';
import { apiRequest } from '../common';
import { DedupeStrategy, Polling, pollingHelper, HttpMethod } from '@activepieces/pieces-common';
import dayjs from 'dayjs';

type Props = {};

const polling: Polling<PiecePropValueSchema<typeof vimeoAuth>, Props> = {
  strategy: DedupeStrategy.TIMEBASED,
  async items({ auth, lastFetchEpochMS }) {
    const response = await apiRequest({
      auth,
      path: '/me/videos',
      method: HttpMethod.GET,
      queryParams: {
        sort: 'date',
        direction: 'desc',
        per_page: '50',
      },
    });

    const videos = response.body.data || [];
    const newVideos = [];

    for (const video of videos) {
      const videoId = video.uri.split('/').pop();
      const createdTime = dayjs(video.created_time).valueOf();

      // If we have a last fetch time and this video is newer, add it to new videos
      if (lastFetchEpochMS && createdTime > lastFetchEpochMS) {
        newVideos.push(video);
      }
      // If no last fetch time (first run), add all videos
      else if (!lastFetchEpochMS) {
        newVideos.push(video);
      }

      video.video_id = videoId;
    }

    return newVideos.map((video) => ({
      epochMilliSeconds: dayjs(video.created_time).valueOf(),
      data: video,
    }));
  },
};

export const newVideoOfMine = createTrigger({
  name: 'new_video_of_mine',
  displayName: 'New Video of Mine',
  description: 'Triggers when you add/upload a new video',
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