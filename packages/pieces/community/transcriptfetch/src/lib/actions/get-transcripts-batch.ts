import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { transcriptFetchAuth } from '../auth';
import { compact, transcriptFetchRequest } from '../common';

export const getTranscriptsBatchAction = createAction({
  name: 'get_transcripts_batch',
  displayName: 'Get Transcripts (Batch)',
  description: 'Gets the transcripts of up to 50 YouTube videos in one call.',
  classification: 'READ',
  audience: 'both',
  aiMetadata: {
    description: 'Returns the transcripts of several YouTube videos at once (video URLs or IDs, up to 50) via the TranscriptFetch API. Read-only.',
    idempotent: true,
  },
  auth: transcriptFetchAuth,
  props: {
    videos: Property.Array({
      displayName: 'Videos',
      description: 'YouTube video URLs or IDs, one per item (up to 50).',
      required: true,
    }),
    mode: Property.StaticDropdown({
      displayName: 'Mode',
      required: false,
      defaultValue: 'auto',
      options: {
        options: [
          { label: 'Auto (captions, then audio)', value: 'auto' },
          { label: 'Captions only', value: 'captions' },
        ],
      },
    }),
  },
  async run(context) {
    const videoIds = (context.propsValue.videos ?? [])
      .map((value) => String(value).trim())
      .filter((value) => value.length > 0);
    if (videoIds.length === 0) throw new Error('Add at least one video.');
    const { mode } = context.propsValue;
    return transcriptFetchRequest({
      apiKey: context.auth.secret_text,
      method: HttpMethod.POST,
      path: '/api/v2/transcripts/batch',
      body: compact({ video_ids: videoIds, mode: mode && mode !== 'auto' ? mode : undefined }),
    });
  },
});
