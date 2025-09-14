import { createAction, Property } from '@activepieces/pieces-framework';
import { makeRequest } from '../common/client';
import { VlmRunAuth } from '../common/auth';
import { HttpMethod } from '@activepieces/pieces-common';

export const analyzeAudio = createAction({
  name: 'analyze-audio',
  displayName: 'Analyze Audio',
  description: 'Process an audio file, extracting features or transcription.',
  auth: VlmRunAuth,
  props: {
    domain: Property.StaticDropdown({
      displayName: 'Domain',
      description: 'Select the domain task for audio analysis',
      required: true,
      options: {
        options: [
          { label: 'Audio Transcription', value: 'audio.transcription' },
          { label: 'Audio Transcription Summary', value: 'audio.transcription-summary' },
        ],
      },
    }),
    url: Property.ShortText({
      displayName: 'Audio URL',
      description: 'Publicly accessible URL of the audio file. Either `url` or `file_id` must be provided.',
      required: false,
    }),
    file_id: Property.ShortText({
      displayName: 'File ID',
      description: 'ID of the uploaded file (alternative to URL). Either `url` or `file_id` must be provided.',
      required: false,
    }),
    metadata: Property.Json({
      displayName: 'Metadata',
      description: 'Optional metadata to pass to the model.',
      required: false,
    }),
    config: Property.Json({
      displayName: 'Config',
      description: 'Optional VLM generation config for audio processing.',
      required: false,
    }),
    callback_url: Property.ShortText({
      displayName: 'Callback URL',
      description: 'Optional URL to call when the request is completed.',
      required: false,
    }),
    model: Property.StaticDropdown({
      displayName: 'Model',
      description: 'Model to use for generating the response.',
      required: true,
      options: {
        options: [{ label: 'vlm-1', value: 'vlm-1' }],
      },
      defaultValue: 'vlm-1',
    }),
    batch: Property.Checkbox({
      displayName: 'Batch Mode',
      description: 'Whether to process the document in batch mode (async).',
      defaultValue: true,
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const body = {
      domain: propsValue.domain,
      url: propsValue.url,
      file_id: propsValue.file_id,
      metadata: propsValue.metadata,
      config: propsValue.config,
      callback_url: propsValue.callback_url,
      model: propsValue.model,
      batch: propsValue.batch,
    };
    

    const response = await makeRequest(
      auth as string,
      HttpMethod.POST,
      `/audio/generate`,
      body
    );
    return response;
  },
});
