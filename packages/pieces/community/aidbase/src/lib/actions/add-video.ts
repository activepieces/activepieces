import { createAction, Property } from '@activepieces/pieces-framework';
import { aidbaseAuth } from '../common/auth';
import { aidbaseClient } from '../common/client';

export const addVideo = createAction({
  auth: aidbaseAuth,
  name: 'add_video',
  displayName: 'Add Video',
  description:
    'Adds a YouTube video URL as knowledge to the Aidbase knowledge base.',
  audience: 'both',
  aiMetadata: {
    description:
      'Registers a YouTube video as a new knowledge source in Aidbase so its content can later be trained on and answered from. Use when ingesting video content into the knowledge base; requires a YouTube video URL. Not idempotent: each call creates a new knowledge source even for the same URL.',
    idempotent: false,
  },

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

    return await aidbaseClient.addVideo(apiKey.secret_text, video_url);
  },
});
