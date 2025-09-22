import { createAction, Property } from '@activepieces/pieces-framework';

export const createTranscription	 = createAction({
  // auth: check https://www.activepieces.com/docs/developers/piece-reference/authentication,
  name: 'createTranscription	',
  displayName: 'Create Transcription	',
  description: 'Creates a task to process speech into readable text.',
  props: {},
  async run() {
    // Action logic here
  },
});
