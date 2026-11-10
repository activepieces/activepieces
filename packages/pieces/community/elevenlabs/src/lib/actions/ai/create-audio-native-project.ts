import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import FormData from 'form-data';
import { elevenlabsAuth } from '../../auth';
import { elevenlabsClient } from '../../client';
import { elevenlabsCreateAudioNativeProjectOutputSchema } from '../../output-schemas';

export const createAudioNativeProject = createAction({
  auth: elevenlabsAuth,
  name: 'elevenlabs_create_audio_native_project',
  outputSchema: elevenlabsCreateAudioNativeProjectOutputSchema,
  displayName: 'Create Audio Native Project',
  description: 'Create an embeddable Audio Native player project',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description: 'Creates an Audio Native project (an embeddable audio player for an article) from an uploaded text or HTML file and returns the project_id and embed html_snippet. Set auto_convert to generate the audio right away. Not idempotent: each call creates a new project.',
    idempotent: false,
  },
  props: {
    name: Property.ShortText({ displayName: 'Name', description: 'Project name', required: true }),
    title: Property.ShortText({ displayName: 'Title', description: 'Title shown in the player', required: false }),
    author: Property.ShortText({ displayName: 'Author', description: 'Author shown in the player', required: false }),
    file: Property.File({ displayName: 'File', description: 'Article as a .txt or .html file', required: false }),
    voiceId: Property.ShortText({ displayName: 'Voice ID', description: 'voice_id from List Voices', required: false }),
    modelId: Property.ShortText({ displayName: 'Model ID', description: 'Model id from List Models', required: false }),
    textColor: Property.ShortText({ displayName: 'Text Color', description: 'Player text colour, such as #000000', required: false }),
    backgroundColor: Property.ShortText({ displayName: 'Background Color', description: 'Player background colour, such as #FFFFFF', required: false }),
    small: Property.StaticDropdown({ displayName: 'Small', description: 'Use the compact player', required: false, options: { options: [{ label: 'Yes', value: true }, { label: 'No', value: false }] } }),
    autoConvert: Property.StaticDropdown({ displayName: 'Auto Convert', description: 'Generate the audio right after creation', required: false, options: { options: [{ label: 'Yes', value: true }, { label: 'No', value: false }] } }),
  },
  async run({ auth, propsValue }) {
    const formData = new FormData();
    formData.append('name', String(propsValue.name));
    if (propsValue.title !== undefined) {
      formData.append('title', String(propsValue.title));
    }
    if (propsValue.author !== undefined) {
      formData.append('author', String(propsValue.author));
    }
    if (propsValue.file) {
      formData.append('file', propsValue.file.data, propsValue.file.filename);
    }
    if (propsValue.voiceId !== undefined) {
      formData.append('voice_id', String(propsValue.voiceId));
    }
    if (propsValue.modelId !== undefined) {
      formData.append('model_id', String(propsValue.modelId));
    }
    if (propsValue.textColor !== undefined) {
      formData.append('text_color', String(propsValue.textColor));
    }
    if (propsValue.backgroundColor !== undefined) {
      formData.append('background_color', String(propsValue.backgroundColor));
    }
    if (propsValue.small !== undefined) {
      formData.append('small', String(propsValue.small));
    }
    if (propsValue.autoConvert !== undefined) {
      formData.append('auto_convert', String(propsValue.autoConvert));
    }
    const response = await elevenlabsClient.request<Record<string, unknown> | undefined>({
      auth,
      method: HttpMethod.POST,
      path: `/v1/audio-native`,
      formData,
    });
    return response ?? { success: true };
  },
});
