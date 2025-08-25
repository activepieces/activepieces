import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { vimeoAuth } from '../common/auth';
import { VimeoClient } from '../common/client';

export const newLikedVideoTrigger = createTrigger({
  auth: vimeoAuth,
  name: 'new-liked-video',
  displayName: 'New Video I\'ve Liked',
  description: 'Fires when you like a new video on Vimeo',
  type: TriggerStrategy.POLLING,
  sampleData: {
    uri: '/videos/123456789',
    name: 'Sample Liked Video',
    description: 'This is a sample video that was liked',
    created_time: '2024-01-01T12:00:00+00:00',
    modified_time: '2024-01-01T12:30:00+00:00',
    privacy: {
      view: 'anybody'
    },
    user: {
      name: 'Sample Creator',
      uri: '/users/987654321'
    },
    embed: {
      html: '<iframe src="https://player.vimeo.com/video/123456789"></iframe>'
    },
    link: 'https://vimeo.com/123456789'
  },
  props: {},
  async onEnable({ auth, store }) {
    const client = new VimeoClient(auth);
    const response = await client.getLikedVideos(1, 1);
    
    if (response.data.length > 0) {
      await store.put('lastLikedVideoUri', response.data[0].uri);
      await store.put('lastLikedVideoTime', response.data[0].modified_time);
    }
  },
  async onDisable() {
    // No cleanup needed
  },
  async run({ auth, store }) {
    const client = new VimeoClient(auth);
    const lastVideoUri = await store.get<string>('lastLikedVideoUri');
    const lastVideoTime = await store.get<string>('lastLikedVideoTime');
    
    const response = await client.getLikedVideos(1, 25);
    const newVideos = [];
    
    for (const video of response.data) {
      if (video.uri === lastVideoUri) {
        break;
      }
      
      if (lastVideoTime && new Date(video.modified_time) <= new Date(lastVideoTime)) {
        continue;
      }
      
      newVideos.push(video);
    }
    
    if (response.data.length > 0) {
      await store.put('lastLikedVideoUri', response.data[0].uri);
      await store.put('lastLikedVideoTime', response.data[0].modified_time);
    }
    
    return newVideos.reverse(); // Return oldest first
  },
});
