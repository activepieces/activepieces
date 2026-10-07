import { createAction } from '@activepieces/pieces-framework';
import { youtubeAuth } from '../common/auth';
import { getVideoOutputSchema } from '../output-schemas';
import { youtubeGetVideoAction } from './get-video';

export const youtubeGetVideoDetailsAction = createAction({
  auth: youtubeAuth,
  outputSchema: getVideoOutputSchema,
  name: 'get_video_details',
  classification: 'READ',
  displayName: 'Get Video Details',
  description: 'Retrieve a video by ID, including its statistics and duration.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Fetches full details for one or more YouTube videos by ID, including title, description, tags, duration, view and like counts, and privacy status. Use it after Search YouTube, List Channel Videos or List Trending Videos hand you a video ID but not its details; use Get Video Rating for the connected account own rating. Up to 50 comma-separated IDs per call. Read-only and idempotent.',
    idempotent: true,
  },
  props: youtubeGetVideoAction.props,
  run: youtubeGetVideoAction.run,
});
