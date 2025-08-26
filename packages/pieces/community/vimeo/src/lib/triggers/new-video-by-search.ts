import { createTrigger, Property, TriggerStrategy } from '@activepieces/pieces-framework';
import { vimeoAuth } from '../auth';
import { apiRequest } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';

export const newVideoBySearch = createTrigger({
  name: 'new_video_by_search',
  displayName: 'New Video by Search',
  description: 'Triggers when a new video is added that matches a search query',
  auth: vimeoAuth,
  props: {
    query: Property.ShortText({
      displayName: 'Search Query',
      description: 'Search term to monitor for new videos',
      required: true,
    }),
  },
  type: TriggerStrategy.POLLING,
  async onEnable(context) {
    const { auth } = context;
    // Store the last video ID for the search query
    const response = await apiRequest({
      auth,
      path: '/videos',
      method: HttpMethod.GET,
      queryParams: {
        query: context.propsValue.query,
        sort: 'date',
        direction: 'desc',
        per_page: '1',
      },
    });

    if (response.body.data && response.body.data.length > 0) {
      context.store.put(`lastVideoId_${context.propsValue.query}`, response.body.data[0].uri.split('/').pop());
    }
  },
  async onDisable() {
    // Clean up if needed
  },
  async run(context) {
    const { auth, store } = context;
    const { query } = context.propsValue;
    const lastVideoId = store.get(`lastVideoId_${query}`);

    const response = await apiRequest({
      auth,
      path: '/videos',
      method: HttpMethod.GET,
      queryParams: {
        query: query,
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
      if (lastVideoId && videoId !== lastVideoId) {
        newVideos.push(video);
      }
      // If no last video ID (first run), add all videos
      else if (!lastVideoId) {
        newVideos.push(video);
      }

      video.video_id = videoId;
    }

    // Update the last video ID
    if (newVideos.length > 0) {
      store.put(`lastVideoId_${query}`, newVideos[0].uri.split('/').pop());
    }

    return newVideos;
  },
  async test(context) {
    const response = await apiRequest({
      auth: context.auth,
      path: '/videos',
      method: HttpMethod.GET,
      queryParams: {
        query: context.propsValue.query,
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