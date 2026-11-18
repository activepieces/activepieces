import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { elevenlabsAuth } from '../../auth';
import { elevenlabsClient } from '../../client';
import { elevenlabsGetDubbingTranscriptOutputSchema } from '../../output-schemas';

export const getDubbingTranscript = createAction({
  auth: elevenlabsAuth,
  name: 'elevenlabs_get_dubbing_transcript',
  outputSchema: elevenlabsGetDubbingTranscriptOutputSchema,
  displayName: 'Get Dubbing Transcript',
  description: 'Get the transcript of a dub',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description: 'Returns the transcript of a finished dub for one language, as structured utterances or as srt or webvtt text.',
    idempotent: true,
  },
  props: {
    dubbingId: Property.ShortText({ displayName: 'Dubbing ID', description: 'The dubbing_id returned by Create Dubbing or List Dubbings', required: true }),
    languageCode: Property.ShortText({ displayName: 'Language Code', description: 'Language code, such as es', required: true }),
    formatType: Property.StaticDropdown({ displayName: 'Format Type', required: false, options: { options: [{ label: 'srt', value: 'srt' }, { label: 'webvtt', value: 'webvtt' }, { label: 'json', value: 'json' }] } }),
  },
  async run({ auth, propsValue }) {
    const response = await elevenlabsClient.request<Record<string, unknown> | undefined>({
      auth,
      method: HttpMethod.GET,
      path: `/v1/dubbing/${encodeURIComponent(propsValue.dubbingId)}/transcript/${encodeURIComponent(propsValue.languageCode)}`,
      queryParams: { format_type: propsValue.formatType },
    });
    return response ?? { success: true };
  },
});
