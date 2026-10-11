import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import FormData from 'form-data';
import { elevenlabsAuth } from '../../auth';
import { elevenlabsClient } from '../../client';
import { elevenlabsUpdateAudioNativeContentOutputSchema } from '../../output-schemas';

export const updateAudioNativeContent = createAction({
  auth: elevenlabsAuth,
  name: 'elevenlabs_update_audio_native_content',
  outputSchema: elevenlabsUpdateAudioNativeContentOutputSchema,
  displayName: 'Update Audio Native Content',
  description: 'Replace the article of an Audio Native project',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description: 'Replaces the article content of an Audio Native project with an uploaded file, optionally regenerating and publishing the audio. Re-applying the same file gives the same result.',
    idempotent: true,
  },
  props: {
    projectId: Property.ShortText({ displayName: 'Project ID', description: 'The project_id returned by Create Audio Native Project', required: true }),
    file: Property.File({ displayName: 'File', description: 'New article as a .txt or .html file', required: true }),
    autoConvert: Property.StaticDropdown({ displayName: 'Auto Convert', description: 'Regenerate the audio', required: false, options: { options: [{ label: 'Yes', value: true }, { label: 'No', value: false }] } }),
    autoPublish: Property.StaticDropdown({ displayName: 'Auto Publish', description: 'Publish after conversion', required: false, options: { options: [{ label: 'Yes', value: true }, { label: 'No', value: false }] } }),
  },
  async run({ auth, propsValue }) {
    const formData = new FormData();
    formData.append('file', propsValue.file.data, propsValue.file.filename);
    if (propsValue.autoConvert !== undefined) {
      formData.append('auto_convert', String(propsValue.autoConvert));
    }
    if (propsValue.autoPublish !== undefined) {
      formData.append('auto_publish', String(propsValue.autoPublish));
    }
    const response = await elevenlabsClient.request<Record<string, unknown> | undefined>({
      auth,
      method: HttpMethod.POST,
      path: `/v1/audio-native/${encodeURIComponent(propsValue.projectId)}/content`,
      formData,
    });
    return response ?? { success: true };
  },
});
