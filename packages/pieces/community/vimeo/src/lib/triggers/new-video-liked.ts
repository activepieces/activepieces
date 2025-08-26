import { createTrigger, Property, TriggerStrategy } from '@activepieces/pieces-framework';
import { vimeoAuth } from '../auth';
import { apiRequest } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';

export const newVideoLiked = createTrigger({
  name: 'new_video_liked',
  displayName: 'New Video I\'ve Liked',
  description: 'Fires when you like a new video on Vimeo',
  auth: vimeoAuth,
  props: {
  },
  type: TriggerStrategy.POLLING,
  async onEnable(context) {
    const { auth } = context;
    // Store the last liked video ID to track new likes
    const response = await apiRequest({
      auth,
      path: '/me/likes',
      method: HttpMethod.GET,
      queryParams: {
        per_page: '1',
      },
    });

    if (response.body.data && response.body.data.length > 0) {
      context.store.put('lastLikedVideoId', response.body.data[0].uri.split('/').pop());
    }
  },
  async onDisable() {
    // Clean up if needed
  },
  async run(context) {
    const { auth, store } = context;
    const lastLikedVideoId = store.get('lastLikedVideoId');

    const response = await apiRequest({
      auth,
      path: '/me/likes',
      method: HttpMethod.GET,
      queryParams: {
        per_page: '25',
      },
    });

    const likedVideos = response.body.data || [];
    const newVideos = [];

    for (const video of likedVideos) {
      const videoId = video.uri.split('/').pop();

      // If we have a last liked video ID and this video is newer, add it to new videos
      if (lastLikedVideoId && videoId !== lastLikedVideoId) {
        newVideos.push(video);
      }
      // If no last liked video ID (first run), add all videos
      else if (!lastLikedVideoId) {
        newVideos.push(video);
      }

      video.video_id = videoId;
    }

    // Update the last liked video ID
    if (newVideos.length > 0) {
      store.put('lastLikedVideoId', newVideos[0].uri.split('/').pop());
    }

    return newVideos;
  },
  async test(context) {
    const response = await apiRequest({
      auth: context.auth,
      path: '/me/likes',
      method: HttpMethod.GET,
      queryParams: {
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