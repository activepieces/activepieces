import { createTrigger, TriggerStrategy, Property } from '@activepieces/pieces-framework';
import { vimeoAuth } from '../common/auth';
import { VimeoClient } from '../common/client';

export const newVideoBySearchTrigger = createTrigger({
  auth: vimeoAuth,
  name: 'new-video-by-search',
  displayName: 'New Video by Search',
  description: 'Fires when a new video is added that matches a search query',
  type: TriggerStrategy.POLLING,
  sampleData: {
    uri: '/videos/123456789',
    name: 'Sample Search Result Video',
    description: 'This video matches your search query',
    created_time: '2024-01-01T12:00:00+00:00',
    modified_time: '2024-01-01T12:30:00+00:00',
    privacy: {
      view: 'anybody'
    },
    user: {
      name: 'Video Creator',
      uri: '/users/987654321'
    },
    embed: {
      html: '<iframe src="https://player.vimeo.com/video/123456789"></iframe>'
    },
    link: 'https://vimeo.com/123456789'
  },
  props: {
    searchQuery: Property.ShortText({
      displayName: 'Search Query',
      description: 'The search term to monitor for new videos',
      required: true,
    }),
  },
  async onEnable({ auth, propsValue, store }) {
    const client = new VimeoClient(auth);
    const response = await client.searchVideos(propsValue.searchQuery, 1, 1);
    
    if (response.data.length > 0) {
      await store.put('lastSearchVideoUri', response.data[0].uri);
      await store.put('lastSearchVideoTime', response.data[0].created_time);
    }
    await store.put('searchQuery', propsValue.searchQuery);
  },
  async onDisable() {
    // No cleanup needed
  },
  async run({ auth, store }) {
    const client = new VimeoClient(auth);
    const searchQuery = await store.get<string>('searchQuery');
    const lastVideoUri = await store.get<string>('lastSearchVideoUri');
    const lastVideoTime = await store.get<string>('lastSearchVideoTime');
    
    if (!searchQuery) {
      return [];
    }
    
    const response = await client.searchVideos(searchQuery, 1, 25);
    const newVideos = [];
    
    for (const video of response.data) {
      if (video.uri === lastVideoUri) {
        break;
      }
      
      if (lastVideoTime && new Date(video.created_time) <= new Date(lastVideoTime)) {
        continue;
      }
      
      newVideos.push(video);
    }
    
    if (response.data.length > 0) {
      await store.put('lastSearchVideoUri', response.data[0].uri);
      await store.put('lastSearchVideoTime', response.data[0].created_time);
    }
    
    return newVideos.reverse(); // Return oldest first
  },
});
