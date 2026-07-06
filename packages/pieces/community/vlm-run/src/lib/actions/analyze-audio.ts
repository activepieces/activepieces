import { propsValidation } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { vlmRunAuth, vlmRunCommon } from '../common';
import { analyzeAudioProperties } from '../common/properties';
import { analyzeAudioSchema } from '../common/schemas';

export const analyzeAudio = createAction({
  auth: vlmRunAuth,
  name: 'analyzeAudio',
  displayName: 'Analyze Audio',
  description: 'Process an audio file, extracting features or transcription',
  audience: 'both',
  aiMetadata: { description: 'Transcribe or extract features from an audio file using VLM Run; uploads the file then runs an audio-transcription prediction. Choose this to get text/transcription from spoken audio. Requires an MP3 audio file as input; each call launches a new prediction job and polls until complete, so it is not idempotent.', idempotent: false },
  props: analyzeAudioProperties,
  async run({ auth: apiKey, propsValue }) {
    await propsValidation.validateZod(propsValue, analyzeAudioSchema);


    const uploadResponse = await vlmRunCommon.uploadFile({
      apiKey:apiKey.secret_text,
      file: propsValue.audio,
    });

    const response = await vlmRunCommon.analyzeAudio({
      apiKey:apiKey.secret_text,
      file_id: uploadResponse.id,
    });

    return await vlmRunCommon.getresponse(apiKey.secret_text, response.id, response.status);
  },
});
