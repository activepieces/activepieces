import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import FormData from 'form-data';
import { elevenlabsAuth } from '../../auth';
import { elevenlabsClient } from '../../client';
import { elevenlabsCreateDubbingOutputSchema } from '../../output-schemas';

export const createDubbing = createAction({
  auth: elevenlabsAuth,
  name: 'elevenlabs_create_dubbing',
  outputSchema: elevenlabsCreateDubbingOutputSchema,
  displayName: 'Create Dubbing',
  description: 'Dub a video or audio file into another language',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description: 'Starts a dubbing job that translates and re-voices a media file or a source URL into the target language, and returns a dubbing_id immediately. Poll Get Dubbing until status is dubbed, then fetch the result with Get Dubbed File. Not idempotent: each call starts a new billable job.',
    idempotent: false,
  },
  props: {
    file: Property.File({ displayName: 'File', description: 'Media file to dub. Provide this or a Source URL', required: false }),
    sourceUrl: Property.ShortText({ displayName: 'Source Url', description: 'URL of the media to dub, such as a YouTube link', required: false }),
    name: Property.ShortText({ displayName: 'Name', description: 'Name of the dubbing project', required: false }),
    targetLang: Property.ShortText({ displayName: 'Target Lang', description: 'Language code to dub into, such as es', required: true }),
    sourceLang: Property.ShortText({ displayName: 'Source Lang', description: 'Language code of the original, or auto', required: false }),
    numSpeakers: Property.Number({ displayName: 'Num Speakers', description: 'Number of speakers, 0 detects automatically', required: false }),
    watermark: Property.StaticDropdown({ displayName: 'Watermark', description: 'Add a watermark', required: false, options: { options: [{ label: 'Yes', value: true }, { label: 'No', value: false }] } }),
    dropBackgroundAudio: Property.StaticDropdown({ displayName: 'Drop Background Audio', description: 'Remove the background audio', required: false, options: { options: [{ label: 'Yes', value: true }, { label: 'No', value: false }] } }),
    highestResolution: Property.StaticDropdown({ displayName: 'Highest Resolution', description: 'Use the highest video resolution', required: false, options: { options: [{ label: 'Yes', value: true }, { label: 'No', value: false }] } }),
  },
  async run({ auth, propsValue }) {
    const formData = new FormData();
    if (propsValue.file) {
      formData.append('file', propsValue.file.data, propsValue.file.filename);
    }
    if (propsValue.sourceUrl !== undefined) {
      formData.append('source_url', String(propsValue.sourceUrl));
    }
    if (propsValue.name !== undefined) {
      formData.append('name', String(propsValue.name));
    }
    formData.append('target_lang', String(propsValue.targetLang));
    if (propsValue.sourceLang !== undefined) {
      formData.append('source_lang', String(propsValue.sourceLang));
    }
    if (propsValue.numSpeakers !== undefined) {
      formData.append('num_speakers', String(propsValue.numSpeakers));
    }
    if (propsValue.watermark !== undefined) {
      formData.append('watermark', String(propsValue.watermark));
    }
    if (propsValue.dropBackgroundAudio !== undefined) {
      formData.append('drop_background_audio', String(propsValue.dropBackgroundAudio));
    }
    if (propsValue.highestResolution !== undefined) {
      formData.append('highest_resolution', String(propsValue.highestResolution));
    }
    const response = await elevenlabsClient.request<Record<string, unknown> | undefined>({
      auth,
      method: HttpMethod.POST,
      path: `/v1/dubbing`,
      formData,
    });
    return response ?? { success: true };
  },
});
