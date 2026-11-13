import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { elevenlabsAuth } from '../../auth';
import { elevenlabsClient } from '../../client';
import { elevenlabsGetDubbedFileOutputSchema } from '../../output-schemas';

export const getPronunciationDictionaryVersion = createAction({
  auth: elevenlabsAuth,
  name: 'elevenlabs_get_pronunciation_dictionary_version',
  outputSchema: elevenlabsGetDubbedFileOutputSchema,
  displayName: 'Get Pronunciation Dictionary Version',
  description: 'Download the PLS file of a dictionary version',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description: 'Downloads the PLS file with the rules of one pronunciation dictionary version as a file. The version_id comes from the dictionary actions.',
    idempotent: true,
  },
  props: {
    dictionaryId: Property.ShortText({ displayName: 'Dictionary ID', description: 'The dictionary id from List Pronunciation Dictionaries', required: true }),
    versionId: Property.ShortText({ displayName: 'Version ID', description: 'The version_id of the dictionary', required: true }),
  },
  async run({ auth, propsValue, files }) {
    const audio = await elevenlabsClient.download({
      auth,
      method: HttpMethod.GET,
      path: `/v1/pronunciation-dictionaries/${encodeURIComponent(propsValue.dictionaryId)}/${encodeURIComponent(propsValue.versionId)}/download`,
    });
    const file = await files.write({ fileName: `${propsValue.versionId}.pls`, data: audio.data });
    return { file, content_type: audio.contentType };
  },
});
