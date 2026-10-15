import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { transcriptFetchAuth } from '../auth';
import { compact, transcriptFetchRequest, waitForJob, withAbsolutePollUrl } from '../common';

export const getTranscriptAction = createAction({
  name: 'get_transcript',
  displayName: 'Get Video Transcript',
  description: 'Gets the transcript of a YouTube, TikTok or Instagram video, using AI transcription when it has no captions.',
  classification: 'READ',
  audience: 'both',
  aiMetadata: {
    description:
      'Returns the full transcript of one video from YouTube, TikTok or Instagram (a URL, or a YouTube video ID) via the TranscriptFetch API, with timestamped segments. When the video has no captions it is transcribed by AI and this waits for the result. Use it to read what is said in a video for summaries, search or analysis. Read-only.',
    idempotent: true,
  },
  auth: transcriptFetchAuth,
  props: {
    video: Property.ShortText({
      displayName: 'Video',
      description: 'A YouTube, TikTok or Instagram video URL, or a YouTube video ID.',
      required: true,
    }),
    mode: Property.StaticDropdown({
      displayName: 'Mode',
      description: 'Auto uses captions when the video has them and AI transcription when it does not. AI transcription costs 1 credit per started 5 minutes of audio.',
      required: false,
      defaultValue: 'auto',
      options: {
        options: [
          { label: 'Auto (captions, then audio)', value: 'auto' },
          { label: 'Captions only', value: 'captions' },
          { label: 'Audio only (AI transcription)', value: 'audio' },
        ],
      },
    }),
    timestamps: Property.Checkbox({
      displayName: 'Timestamps',
      description: 'Return timestamped segments as well as the full text.',
      required: false,
      defaultValue: true,
    }),
    wait_for_job: Property.Checkbox({
      displayName: 'Wait for AI Transcription',
      description: 'When the video needs AI transcription, wait for it and return the finished transcript. Turn off to get the job back at once and fetch it later with Get Transcription Job.',
      required: false,
      defaultValue: true,
    }),
    max_wait_seconds: Property.Number({
      displayName: 'Max Wait (seconds)',
      description: 'How long to wait for AI transcription before returning the unfinished job.',
      required: false,
      defaultValue: 300,
    }),
  },
  async run(context) {
    const { video, mode, timestamps, wait_for_job, max_wait_seconds } = context.propsValue;
    const apiKey = context.auth.secret_text;
    const first = await transcriptFetchRequest({
      apiKey,
      method: HttpMethod.POST,
      path: '/api/v2/transcripts/video',
      body: compact({
        video,
        mode: mode && mode !== 'auto' ? mode : undefined,
        timestamps: timestamps === false ? false : undefined,
      }),
    });
    if (first.status === 'processing' && first.job_id && wait_for_job !== false) {
      return waitForJob({ apiKey, first, maxWaitSeconds: Math.min(Math.max(max_wait_seconds ?? 300, 10), 600) });
    }
    return withAbsolutePollUrl(first);
  },
});
