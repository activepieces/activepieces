import { createTrigger, Property, TriggerStrategy } from '@activepieces/pieces-framework';
import { vimeoAuth } from '../auth';
import { apiRequest } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';

export const newVideoOfMine = createTrigger({
  name: 'new_video_of_mine',
  displayName: 'New Video of Mine',
  description: 'Triggers when you add/upload a new video',
  auth: vimeoAuth,
  props: {
  },
  type: TriggerStrategy.POLLING,
  async onEnable(context) {
    const { auth } = context;
    // Store the last video ID for the user's videos
    const response = await apiRequest({
      auth,
      path: '/me/videos',
      method: HttpMethod.GET,
      queryParams: {
        sort: 'date',
        direction: 'desc',
        per_page: '1',
      },
    });

    if (response.body.data && response.body.data.length > 0) {
      context.store.put('lastMyVideoId', response.body.data[0].uri.split('/').pop());
    }
  },
  async onDisable() {
    // Clean up if needed
  },
  async run(context) {
    const { auth, store } = context;
    const lastMyVideoId = store.get('lastMyVideoId');

    const response = await apiRequest({
      auth,
      path: '/me/videos',
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
      if (lastMyVideoId && videoId !== lastMyVideoId) {
        newVideos.push(video);
      }
      // If no last video ID (first run), add all videos
      else if (!lastMyVideoId) {
        newVideos.push(video);
      }

      video.video_id = videoId;
    }

    // Update the last video ID
    if (newVideos.length > 0) {
      store.put('lastMyVideoId', newVideos[0].uri.split('/').pop());
    }

    return newVideos;
  },
  async test(context) {
    const response = await apiRequest({
      auth: context.auth,
      path: '/me/videos',
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