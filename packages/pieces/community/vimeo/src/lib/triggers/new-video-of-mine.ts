import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { vimeoAuth } from '../common/auth';
import { VimeoClient } from '../common/client';

export const newVideoOfMineTrigger = createTrigger({
  auth: vimeoAuth,
  name: 'new-video-of-mine',
  displayName: 'New Video of Mine',
  description: 'Fires when you add/upload a new video',
  type: TriggerStrategy.POLLING,
  sampleData: {
    uri: '/videos/123456789',
    name: 'My New Video',
    description: 'This is a video I just uploaded',
    created_time: '2024-01-01T12:00:00+00:00',
    modified_time: '2024-01-01T12:30:00+00:00',
    privacy: {
      view: 'anybody'
    },
    user: {
      name: 'Me',
      uri: '/users/me'
    },
    embed: {
      html: '<iframe src="https://player.vimeo.com/video/123456789"></iframe>'
    },
    link: 'https://vimeo.com/123456789'
  },
  props: {},
  async onEnable({ auth, store }) {
    const client = new VimeoClient(auth);
    const response = await client.getUserVideos(1, 1);
    
    if (response.data.length > 0) {
      await store.put('lastMyVideoUri', response.data[0].uri);
      await store.put('lastMyVideoTime', response.data[0].created_time);
    }
  },
  async onDisable() {
    // No cleanup needed
  },
  async run({ auth, store }) {
    const client = new VimeoClient(auth);
    const lastVideoUri = await store.get<string>('lastMyVideoUri');
    const lastVideoTime = await store.get<string>('lastMyVideoTime');
    
    const response = await client.getUserVideos(1, 25);
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
      await store.put('lastMyVideoUri', response.data[0].uri);
      await store.put('lastMyVideoTime', response.data[0].created_time);
    }
    
    return newVideos.reverse(); // Return oldest first
  },
});
