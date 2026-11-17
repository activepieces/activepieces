import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { groqAuth } from '../../auth';
import { groqAiProps } from '../../common/ai-props';
import { groqClient } from '../../common/client';
import { groqUtils } from '../../common/utils';
import { groqCreateTranscriptionOutputSchema } from '../../output-schemas';

export const createTranscriptionAction = createAction({
  auth: groqAuth,
  name: 'groq_create_transcription',
  outputSchema: groqCreateTranscriptionOutputSchema,
  displayName: 'Create Transcription',
  description: 'Turn speech in an audio file into text in the spoken language.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Transcribes an audio file or URL into text in the language spoken, with Whisper. Use Create Translation instead when the text must be English. Give exactly one of Audio File and Audio URL; verbose_json adds language, duration and segment timings, and word timestamps when asked.',
    idempotent: false,
  },
  props: {
    audioFile: groqAiProps.audioFile({ required: false }),
    audioUrl: groqAiProps.audioUrl({ required: false }),
    modelId: groqAiProps.modelId({
      required: true,
      description: 'Whisper model ID: "whisper-large-v3" or the faster "whisper-large-v3-turbo".',
    }),
    language: Property.ShortText({
      displayName: 'Language',
      description: 'ISO-639-1 code of the spoken language, e.g. "en". Improves accuracy and speed. Detected when empty.',
      required: false,
    }),
    prompt: Property.LongText({
      displayName: 'Prompt',
      description: 'Text that guides spelling and style, in the language of the audio.',
      required: false,
    }),
    temperature: Property.Number({
      displayName: 'Temperature',
      description: 'Sampling temperature from 0 to 1. Groq recommends 0, the default.',
      required: false,
    }),
    responseFormat: groqAiProps.audioResponseFormat({ required: false }),
    timestampGranularities: Property.StaticMultiSelectDropdown({
      displayName: 'Timestamp Granularities',
      description: 'Add "word" and/or "segment" timestamps. Needs Response Format "verbose_json".',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'Word', value: 'word' },
          { label: 'Segment', value: 'segment' },
        ],
      },
    }),
  },
  async run({ auth, propsValue }) {
    const granularities = propsValue.timestampGranularities ?? [];
    if (granularities.length > 0 && propsValue.responseFormat !== 'verbose_json') {
      throw new Error('Timestamp Granularities needs Response Format "verbose_json".');
    }
    const formData = groqUtils.audioForm({
      file: propsValue.audioFile,
      url: propsValue.audioUrl,
      fields: {
        model: propsValue.modelId,
        language: propsValue.language,
        prompt: propsValue.prompt,
        temperature: propsValue.temperature,
        response_format: propsValue.responseFormat,
      },
    });
    for (const granularity of granularities) {
      formData.append('timestamp_granularities[]', granularity);
    }
    return await groqClient.request({
      auth,
      method: HttpMethod.POST,
      path: '/audio/transcriptions',
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      body: formData,
    });
  },
});
