import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { elevenlabsAuth } from '../../auth';
import { elevenlabsClient } from '../../client';
import { elevenlabsGetDubbedFileOutputSchema } from '../../output-schemas';

export const getDubbedFile = createAction({
  auth: elevenlabsAuth,
  name: 'elevenlabs_get_dubbed_file',
  outputSchema: elevenlabsGetDubbedFileOutputSchema,
  displayName: 'Get Dubbed File',
  description: 'Download the dubbed audio or video',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description: 'Downloads the finished dub for one language as a file. Only works once Get Dubbing reports status dubbed.',
    idempotent: true,
  },
  props: {
    dubbingId: Property.ShortText({ displayName: 'Dubbing ID', description: 'The dubbing_id returned by Create Dubbing or List Dubbings', required: true }),
    languageCode: Property.ShortText({ displayName: 'Language Code', description: 'Target language code, such as es', required: true }),
  },
  async run({ auth, propsValue, files }) {
    const audio = await elevenlabsClient.download({
      auth,
      method: HttpMethod.GET,
      path: `/v1/dubbing/${encodeURIComponent(propsValue.dubbingId)}/audio/${encodeURIComponent(propsValue.languageCode)}`,
    });
    const file = await files.write({ fileName: `${propsValue.dubbingId}-${propsValue.languageCode}.${elevenlabsClient.extensionFor({ contentType: audio.contentType })}`, data: audio.data });
    return { file, content_type: audio.contentType };
  },
});
