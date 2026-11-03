import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { elevenlabsAuth } from '../../auth';
import { elevenlabsClient } from '../../client';
import { elevenlabsGetDubbingTranscriptFormattedOutputSchema } from '../../output-schemas';

export const getDubbingTranscriptFormatted = createAction({
  auth: elevenlabsAuth,
  name: 'elevenlabs_get_dubbing_transcript_formatted',
  outputSchema: elevenlabsGetDubbingTranscriptFormattedOutputSchema,
  displayName: 'Get Dubbing Transcript Formatted',
  description: 'Get a dub transcript in a chosen format',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description: 'Returns the transcript of a finished dub for one language in the requested format (srt, webvtt or json).',
    idempotent: true,
  },
  props: {
    dubbingId: Property.ShortText({ displayName: 'Dubbing ID', description: 'The dubbing_id returned by Create Dubbing or List Dubbings', required: true }),
    languageCode: Property.ShortText({ displayName: 'Language Code', description: 'Language code, such as es', required: true }),
    formatType: Property.ShortText({ displayName: 'Format Type', description: 'One of srt, webvtt or json', required: true }),
  },
  async run({ auth, propsValue }) {
    const response = await elevenlabsClient.request<Record<string, unknown> | undefined>({
      auth,
      method: HttpMethod.GET,
      path: `/v1/dubbing/${encodeURIComponent(propsValue.dubbingId)}/transcripts/${encodeURIComponent(propsValue.languageCode)}/format/${encodeURIComponent(propsValue.formatType)}`,
    });
    return response ?? { success: true };
  },
});
