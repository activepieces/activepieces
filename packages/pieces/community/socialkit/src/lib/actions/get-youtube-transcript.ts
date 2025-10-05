import { createAction, Property } from '@activepieces/pieces-framework';

export const getYoutubeTranscript = createAction({
  // auth: check https://www.activepieces.com/docs/developers/piece-reference/authentication,
  name: 'getYoutubeTranscript',
  displayName: 'Get YouTube Transcript',
  description: 'Retrieve the transcript (text + timestamps) of a YouTube video via SocialKit’s transcript API.',
  props: {},
  async run() {
    // Action logic here
  },
});
