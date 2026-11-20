import { createAction, Property } from '@activepieces/pieces-framework';
import { supadataAuth } from '../auth';
import { supadataClient } from '../common/client';
import { getTranscriptOutputSchema } from '../output-schemas';

export const getTranscriptAction = createAction({
  name: 'get_transcript',
  outputSchema: getTranscriptOutputSchema,
  classification: 'READ',
  displayName: 'Get Transcript',
  description: 'Fetches transcript of a YouTube video.',
  audience: 'both',
  aiMetadata: { description: 'Retrieves the transcript text of a single YouTube video via the Supadata API, given the video URL. Use to read the spoken content of a video for summarization, search, or analysis; optionally request a preferred language and choose between one merged text block or timestamped chunks. Read-only and idempotent.', idempotent: true },
  auth: supadataAuth,
  props: {
    url: Property.ShortText({
      displayName: 'YouTube URL',
      description: 'A single video, not a playlist or channel.',
      placeholder: 'https://youtu.be/dQw4w9WgXcQ',
      required: true,
    }),
    lang: Property.ShortText({
      displayName: 'Language',
      description: 'ISO 639-1 code. Falls back to the first available language.',
      placeholder: 'en',
      required: false,
    }),
    text: Property.Checkbox({
      displayName: 'Merge Text',
      description: 'Off returns timestamped chunks instead of one block of text.',
      required: false,
      defaultValue: true,
    })
  },
  async run(context) {
    const { url, text, lang } = context.propsValue;
    return supadataClient.request({
      apiKey: context.auth.secret_text,
      method: supadataClient.GET,
      path: '/youtube/transcript',
      query: { url, text: text ? 'true' : 'false', lang },
    });
  },
});
