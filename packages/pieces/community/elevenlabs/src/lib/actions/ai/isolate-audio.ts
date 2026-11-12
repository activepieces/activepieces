import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import FormData from 'form-data';
import { elevenlabsAuth } from '../../auth';
import { elevenlabsClient } from '../../client';
import { elevenlabsGetDubbedFileOutputSchema } from '../../output-schemas';

export const isolateAudio = createAction({
  auth: elevenlabsAuth,
  name: 'elevenlabs_isolate_audio',
  outputSchema: elevenlabsGetDubbedFileOutputSchema,
  displayName: 'Isolate Audio',
  description: 'Remove background noise and keep only the voice',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description: 'Removes background noise and music from an audio file, keeping the speech, and returns the cleaned audio as a file. Use to clean a recording before cloning a voice or transcribing it. Not idempotent: each call consumes credits.',
    idempotent: false,
  },
  props: {
    audio: Property.File({ displayName: 'Audio', description: 'Recording to clean', required: true }),
  },
  async run({ auth, propsValue, files }) {
    const formData = new FormData();
    formData.append('audio', propsValue.audio.data, propsValue.audio.filename);
    const audio = await elevenlabsClient.download({
      auth,
      method: HttpMethod.POST,
      path: `/v1/audio-isolation`,
      formData,
    });
    const file = await files.write({ fileName: `isolated.${elevenlabsClient.extensionFor({ contentType: audio.contentType })}`, data: audio.data });
    return { file, content_type: audio.contentType };
  },
});
