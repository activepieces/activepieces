import { createAction } from '@activepieces/pieces-framework';
import { youtubeAuth } from '../common/auth';
import { listCaptionsOutputSchema } from '../output-schemas';
import { youtubeListCaptionsAction } from './list-captions';

export const youtubeListCaptionTracksAction = createAction({
  auth: youtubeAuth,
  outputSchema: listCaptionsOutputSchema,
  name: 'list_caption_tracks',
  classification: 'SEARCH',
  displayName: 'List Caption Tracks',
  description:
    'Returns caption tracks for a specific YouTube video using the captions.list endpoint.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists the caption tracks attached to a single YouTube video and supplies the caption ID that Download Caption Track requires. Use it to find which languages a video is captioned in. The video ID is mandatory and this call is unusually expensive in YouTube quota, so avoid repeating it. Read-only and idempotent.',
    idempotent: true,
  },
  props: youtubeListCaptionsAction.props,
  run: youtubeListCaptionsAction.run,
});
