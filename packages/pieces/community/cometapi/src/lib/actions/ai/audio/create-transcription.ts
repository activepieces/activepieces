import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { cometApiAuth } from '../../../auth';
import { cometApiAiProps } from '../../../common/ai-props';
import { cometApiClient } from '../../../common/client';
import { cometapiCreateTranscriptionOutputSchema } from '../../../output-schemas';

export const createTranscriptionAction = createAction({
  auth: cometApiAuth,
  name: 'cometapi_create_transcription',
  outputSchema: cometapiCreateTranscriptionOutputSchema,
  displayName: 'Create Transcription',
  description: 'Transcribes an audio file into text in its spoken language.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Transcribes an audio file (mp3, mp4, mpeg, mpga, m4a, wav or webm) into text in its spoken language with a speech-to-text model such as whisper-1 or gpt-4o-transcribe. Use Create Translation to get English text instead. Each call is billed by audio length.',
    idempotent: false,
  },
  props: {
    model: cometApiAiProps.speechToTextModel({ required: true }),
    file: cometApiAiProps.audioFile({ required: true }),
    language: Property.ShortText({
      displayName: 'Language',
      description:
        'ISO-639-1 code of the spoken language, e.g. "en". Improves accuracy and speed.',
      required: false,
    }),
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
      language: propsValue.language,
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
      path: '/audio/transcriptions',
      body: form,
    });
  },
});
