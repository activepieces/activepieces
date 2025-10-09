import { createAction, Property } from '@activepieces/pieces-framework';
import { aidbaseAuth } from '../common/auth';
import { aidbaseClient } from '../common/client';

export const addVideo = createAction({
  auth: aidbaseAuth,
  name: 'add_video',
  displayName: 'Add Video',
  description:
    'Adds a YouTube video URL as knowledge to the Aidbase knowledge base.',

  props: {
    video_url: Property.ShortText({
      displayName: 'YouTube Video URL',
      description: 'The URL of the YouTube video to add as a knowledge source.',
      required: true,
    }),
  },

  async run(context) {
    const { auth: apiKey, propsValue } = context;
    const { video_url } = propsValue;

    return await aidbaseClient.addVideo(apiKey, video_url);
  },
});
