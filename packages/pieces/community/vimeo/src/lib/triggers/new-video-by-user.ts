import { createTrigger, Property, TriggerStrategy } from '@activepieces/pieces-framework';
import { vimeoAuth } from '../auth';
import { apiRequest } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';

export const newVideoByUser = createTrigger({
  name: 'new_video_by_user',
  displayName: 'New Video by User',
  description: 'Triggers when another specified user adds a video',
  auth: vimeoAuth,
  props: {
    userId: Property.ShortText({
      displayName: 'User ID',
      description: 'ID of the user to monitor for new videos',
      required: true,
    }),
  },
  type: TriggerStrategy.POLLING,
  async onEnable(context) {
    const { auth } = context;
    // Store the last video ID for the user's videos
    const response = await apiRequest({
      auth,
      path: `/users/${context.propsValue.userId}/videos`,
      method: HttpMethod.GET,
      queryParams: {
        sort: 'date',
        direction: 'desc',
        per_page: '1',
      },
    });

    if (response.body.data && response.body.data.length > 0) {
      context.store.put(`lastUserVideoId_${context.propsValue.userId}`, response.body.data[0].uri.split('/').pop());
    }
  },
  async onDisable() {
    // Clean up if needed
  },
  async run(context) {
    const { auth, store } = context;
    const { userId } = context.propsValue;
    const lastUserVideoId = store.get(`lastUserVideoId_${userId}`);

    const response = await apiRequest({
      auth,
      path: `/users/${userId}/videos`,
      method: HttpMethod.GET,
      queryParams: {
        sort: 'date',
        direction: 'desc',
        per_page: '25',
      },
    });

    const videos = response.body.data || [];
    const newVideos = [];

    for (const video of videos) {
      const videoId = video.uri.split('/').pop();

      // If we have a last video ID and this video is newer, add it to new videos
      if (lastUserVideoId && videoId !== lastUserVideoId) {
        newVideos.push(video);
      }
      // If no last video ID (first run), add all videos
      else if (!lastUserVideoId) {
        newVideos.push(video);
      }

      video.video_id = videoId;
    }

    // Update the last video ID
    if (newVideos.length > 0) {
      store.put(`lastUserVideoId_${userId}`, newVideos[0].uri.split('/').pop());
    }

    return newVideos;
  },
  async test(context) {
    const response = await apiRequest({
      auth: context.auth,
      path: `/users/${context.propsValue.userId}/videos`,
      method: HttpMethod.GET,
      queryParams: {
        sort: 'date',
        direction: 'desc',
        per_page: '1',
      },
    });

    const list = response.body.data;
    for (let i = 0; i < list.length; i++) {
      const video = list[i];
      video.video_id = video.uri.split('/').pop();
    }

    return list;
  },
  sampleData: {},
});