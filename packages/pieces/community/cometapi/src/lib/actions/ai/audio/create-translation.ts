import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { cometApiAuth } from '../../../auth';
import { cometApiAiProps } from '../../../common/ai-props';
import { cometApiClient } from '../../../common/client';
import { cometapiCreateTranscriptionOutputSchema } from '../../../output-schemas';

export const createTranslationAction = createAction({
  auth: cometApiAuth,
  name: 'cometapi_create_translation',
  outputSchema: cometapiCreateTranscriptionOutputSchema,
  displayName: 'Create Translation',
  description: 'Translates an audio file into English text.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Translates speech in an audio file (mp3, mp4, mpeg, mpga, m4a, wav or webm) into English text with whisper-1. Use Create Transcription to keep the original language. Each call is billed by audio length.',
    idempotent: false,
  },
  props: {
    model: cometApiAiProps.speechToTextModel({ required: true }),
    file: cometApiAiProps.audioFile({ required: true }),

    prompt: cometApiAiProps.transcriptionPrompt({ required: false }),
    responseFormat: cometApiAiProps.transcriptionResponseFormat({
      required: false,
    }),
    temperature: cometApiAiProps.temperature({ required: false }),
  },
  async run({ auth, propsValue }) {
    const { file } = propsValue;
    const form = new FormData();
    form.append('file', new Blob([new Uint8Array(file.data)]), file.filename);
    form.append('model', propsValue.model);
    const optional = {
      prompt: propsValue.prompt,
      response_format: propsValue.responseFormat,
      temperature: propsValue.temperature?.toString(),
    };
    for (const [key, value] of Object.entries(optional)) {
      if (value !== undefined) {
        form.append(key, value);
      }
    }
    return await cometApiClient.request({
      auth,
      method: HttpMethod.POST,
      path: '/audio/translations',
      body: form,
    });
  },
});
