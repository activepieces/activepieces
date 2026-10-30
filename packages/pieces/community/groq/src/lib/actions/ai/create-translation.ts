import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { groqAuth } from '../../auth';
import { groqAiProps } from '../../common/ai-props';
import { groqClient } from '../../common/client';
import { groqUtils } from '../../common/utils';
import { groqCreateTranslationOutputSchema } from '../../output-schemas';

export const createTranslationAction = createAction({
  auth: groqAuth,
  name: 'groq_create_translation',
  outputSchema: groqCreateTranslationOutputSchema,
  displayName: 'Create Translation',
  description: 'Turn speech in any language into English text.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Translates the speech in an audio file or URL into English text, with Whisper (whisper-large-v3; the turbo model cannot translate). Use Create Transcription to keep the spoken language. Give exactly one of Audio File and Audio URL; verbose_json adds language, duration and segment timings.',
    idempotent: false,
  },
  props: {
    audioFile: groqAiProps.audioFile({ required: false }),
    audioUrl: groqAiProps.audioUrl({ required: false }),
    modelId: groqAiProps.modelId({
      required: true,
      description: 'Whisper model ID: "whisper-large-v3".',
    }),
    prompt: Property.LongText({
      displayName: 'Prompt',
      description: 'English text that guides spelling and style.',
      required: false,
    }),
    temperature: Property.Number({
      displayName: 'Temperature',
      description: 'Sampling temperature from 0 to 1. Groq recommends 0, the default.',
      required: false,
    }),
    responseFormat: groqAiProps.audioResponseFormat({ required: false }),
  },
  async run({ auth, propsValue }) {
    return await groqClient.request({
      auth,
      method: HttpMethod.POST,
      path: '/audio/translations',
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      body: groqUtils.audioForm({
        file: propsValue.audioFile,
        url: propsValue.audioUrl,
        fields: {
          model: propsValue.modelId,
          prompt: propsValue.prompt,
          temperature: propsValue.temperature,
          response_format: propsValue.responseFormat,
        },
      }),
    });
  },
});
