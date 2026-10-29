import { createAction, Property } from '@activepieces/pieces-framework';
import { supadataAuth } from '../auth';
import { supadataClient } from '../common/client';
import { getTranscriptOutputSchema } from '../output-schemas';

export const getTranscriptFromUrlAction = createAction({
  name: 'supadata_get_transcript',
  outputSchema: getTranscriptOutputSchema,
  displayName: 'Get Transcript From URL',
  description: 'Fetches the transcript of a video on YouTube, TikTok, Instagram, X or Facebook, or of a public media file.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description: 'Retrieves the transcript of a video from YouTube, TikTok, Instagram, X (Twitter), Facebook or a public file URL; falls back to AI generation when no native transcript exists. Large videos return a jobId instead of content: pass it to supadata_get_transcript_job. Works for any platform; the existing get_transcript is YouTube-only. Read-only.',
    idempotent: true,
  },
  auth: supadataAuth,
  props: {
    url: Property.ShortText({
      displayName: 'Video URL',
      description: 'URL of the video or media file.',
      required: true,
    }),
    lang: Property.ShortText({
      displayName: 'Language',
      description: 'Preferred transcript language (ISO 639-1 code), e.g. en.',
      required: false,
    }),
    text: Property.Checkbox({
      displayName: 'Merge Text',
      description: 'If true, returns the transcript as one text block instead of timestamped chunks.',
      required: false,
      defaultValue: true,
    }),
    chunkSize: Property.Number({
      displayName: 'Chunk Size',
      description: 'Maximum characters per chunk when Merge Text is off.',
      required: false,
    }),
    mode: Property.StaticDropdown({
      displayName: 'Mode',
      description: 'native uses existing transcripts only, generate forces AI transcription, auto tries native then AI.',
      required: false,
      options: { disabled: false, options: [{ label: 'native', value: 'native' }, { label: 'auto', value: 'auto' }, { label: 'generate', value: 'generate' }] },
    }),
  },
  async run(context) {
    const { url, lang, text, chunkSize, mode } = context.propsValue;
    return supadataClient.request({
      apiKey: context.auth.secret_text,
      method: supadataClient.GET,
      path: '/transcript',
      query: { url, lang, text, chunkSize, mode },
    });
  },
});
