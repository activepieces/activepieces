import { createAction, Property } from '@activepieces/pieces-framework';
import { getYoutubeTranscriptAuth } from '../auth';
import { getYoutubeTranscriptRequest } from '../common/client';

export const getTranscriptAction = createAction({
  name: 'get_transcript',
  classification: 'READ',
  displayName: 'Get Transcript',
  description: 'Gets the transcript of a YouTube video, optionally with per-line timestamps.',
  audience: 'both',
  aiMetadata: {
    description:
      'Retrieves the spoken text (captions) of a single YouTube video given its URL or 11-character ID, plus title and channel. Set timestamps to true to also get one {start, duration, text} segment per caption line, in seconds, for quoting or linking moments. Read-only and idempotent.',
    idempotent: true,
  },
  auth: getYoutubeTranscriptAuth,
  props: {
    video: Property.ShortText({
      displayName: 'YouTube Video URL or ID',
      description: 'A watch, youtu.be, Shorts, or live URL, or the 11-character video ID.',
      required: true,
    }),
    language: Property.ShortText({
      displayName: 'Language',
      description: "Caption language code, e.g. 'en' or 'es'. Defaults to 'en'.",
      required: false,
    }),
    timestamps: Property.Checkbox({
      displayName: 'Include Timestamps',
      description: 'Also return segments: one {start, duration, text} per caption line, times in seconds.',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const { video, language, timestamps } = context.propsValue;
    return getYoutubeTranscriptRequest(context.auth.secret_text, '/transcript', {
      v: video,
      language: language ?? undefined,
      timestamps: timestamps ? 'true' : undefined,
    });
  },
});
