import { createTrigger, TriggerStrategy, Property } from '@activepieces/pieces-framework';
import { vimeoAuth } from '../common/auth';
import { VimeoClient } from '../common/client';

export const newVideoByUserTrigger = createTrigger({
  auth: vimeoAuth,
  name: 'new-video-by-user',
  displayName: 'New Video by User',
  description: 'Fires when another specified user adds a video',
  type: TriggerStrategy.POLLING,
  sampleData: {
    uri: '/videos/123456789',
    name: 'New Video by User',
    description: 'This is a video uploaded by the specified user',
    created_time: '2024-01-01T12:00:00+00:00',
    modified_time: '2024-01-01T12:30:00+00:00',
    privacy: {
      view: 'anybody'
    },
    user: {
      name: 'Specified User',
      uri: '/users/987654321'
    },
    embed: {
      html: '<iframe src="https://player.vimeo.com/video/123456789"></iframe>'
    },
    link: 'https://vimeo.com/123456789'
  },
  props: {
    userUri: Property.ShortText({
      displayName: 'User URI',
      description: 'The Vimeo user URI to monitor (e.g., /users/123456789 or just the user ID)',
      required: true,
    }),
  },
  async onEnable({ auth, propsValue, store }) {
    const client = new VimeoClient(auth);
    let userUri = propsValue.userUri;
    
    // Normalize user URI
    if (!userUri.startsWith('/users/')) {
      userUri = `/users/${userUri}`;
    }
    
    const response = await client.getUserVideosByUri(userUri, 1, 1);
    
    if (response.data.length > 0) {
      await store.put('lastUserVideoUri', response.data[0].uri);
      await store.put('lastUserVideoTime', response.data[0].created_time);
    }
    await store.put('monitoredUserUri', userUri);
  },
  async onDisable() {
    // No cleanup needed
  },
  async run({ auth, store }) {
    const client = new VimeoClient(auth);
    const userUri = await store.get<string>('monitoredUserUri');
    const lastVideoUri = await store.get<string>('lastUserVideoUri');
    const lastVideoTime = await store.get<string>('lastUserVideoTime');
    
    if (!userUri) {
      return [];
    }
    
    const response = await client.getUserVideosByUri(userUri, 1, 25);
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
      await store.put('lastUserVideoUri', response.data[0].uri);
      await store.put('lastUserVideoTime', response.data[0].created_time);
    }
    
    return newVideos.reverse(); // Return oldest first
  },
});
