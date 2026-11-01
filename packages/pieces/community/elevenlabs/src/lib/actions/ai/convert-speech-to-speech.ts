import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import FormData from 'form-data';
import { elevenlabsAuth } from '../../auth';
import { elevenlabsClient } from '../../client';
import { elevenlabsGetDubbedFileOutputSchema } from '../../output-schemas';

export const convertSpeechToSpeech = createAction({
  auth: elevenlabsAuth,
  name: 'elevenlabs_convert_speech_to_speech',
  outputSchema: elevenlabsGetDubbedFileOutputSchema,
  displayName: 'Convert Speech To Speech',
  description: 'Re-speak an audio recording in a different voice',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description: 'Converts an uploaded audio recording into speech in the chosen voice, keeping the original delivery, and returns the audio as a file. Use to change who is speaking in an existing recording. Not idempotent: each call consumes credits and produces new audio.',
    idempotent: false,
  },
  props: {
    voiceId: Property.ShortText({ displayName: 'Voice ID', description: 'The voice_id from List Voices', required: true }),
    audio: Property.File({ displayName: 'Audio', description: 'Recording to convert', required: true }),
    modelId: Property.ShortText({ displayName: 'Model ID', description: 'Speech-to-speech model id from List Models, such as eleven_multilingual_sts_v2', required: false }),
    removeBackgroundNoise: Property.StaticDropdown({ displayName: 'Remove Background Noise', description: 'Remove background noise from the input', required: false, options: { options: [{ label: 'Yes', value: true }, { label: 'No', value: false }] } }),
    outputFormat: Property.StaticDropdown({ displayName: 'Output Format', description: 'Defaults to mp3_44100_128', required: false, options: { options: [{ label: 'mp3_44100_128', value: 'mp3_44100_128' }, { label: 'mp3_44100_192', value: 'mp3_44100_192' }, { label: 'mp3_22050_32', value: 'mp3_22050_32' }, { label: 'pcm_16000', value: 'pcm_16000' }, { label: 'pcm_44100', value: 'pcm_44100' }] } }),
  },
  async run({ auth, propsValue, files }) {
    const formData = new FormData();
    formData.append('audio', propsValue.audio.data, propsValue.audio.filename);
    if (propsValue.modelId !== undefined) {
      formData.append('model_id', String(propsValue.modelId));
    }
    if (propsValue.removeBackgroundNoise !== undefined) {
      formData.append('remove_background_noise', String(propsValue.removeBackgroundNoise));
    }
    const audio = await elevenlabsClient.download({
      auth,
      method: HttpMethod.POST,
      path: `/v1/speech-to-speech/${encodeURIComponent(propsValue.voiceId)}`,
      queryParams: { output_format: propsValue.outputFormat },
      formData,
    });
    const file = await files.write({ fileName: `speech.${elevenlabsClient.extensionFor({ contentType: audio.contentType })}`, data: audio.data });
    return { file, content_type: audio.contentType };
  },
});
