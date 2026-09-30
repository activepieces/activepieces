import { createAction } from '@activepieces/pieces-framework';
import { youtubeAuth } from '../common/auth';
import { getChannelOutputSchema } from '../output-schemas';
import { youtubeGetChannelAction } from './get-channel';

export const youtubeGetChannelDetailsAction = createAction({
  auth: youtubeAuth,
  outputSchema: getChannelOutputSchema,
  name: 'get_channel_details',
  classification: 'READ',
  displayName: 'Get Channel Details',
  description:
    'Retrieve a channel by ID or handle, including its subscriber and view counts.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Fetches a YouTube channel by channel ID or @handle, returning title, description, country, subscriber count, view count and video count. Use it to resolve a channel reference into statistics or an ID; use List Channel Videos when the goal is that channel uploads. Read-only and idempotent.',
    idempotent: true,
  },
  props: youtubeGetChannelAction.props,
  run: youtubeGetChannelAction.run,
});
