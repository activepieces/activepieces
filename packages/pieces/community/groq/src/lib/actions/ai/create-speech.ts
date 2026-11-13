import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { groqAuth } from '../../auth';
import { groqAiProps } from '../../common/ai-props';
import { groqClient } from '../../common/client';
import { groqCreateSpeechOutputSchema } from '../../output-schemas';

export const createSpeechAction = createAction({
  auth: groqAuth,
  name: 'groq_create_speech',
  outputSchema: groqCreateSpeechOutputSchema,
  displayName: 'Create Speech',
  description: 'Turn text into spoken audio.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Generates spoken audio from text with a Groq text-to-speech model and returns it as a file. English uses "canopylabs/orpheus-v1-english" (voices such as troy, austin, hannah; bracketed directions like [cheerful] change the delivery); Arabic uses "canopylabs/orpheus-arabic-saudi". The model terms must be accepted once in the Groq console.',
    idempotent: false,
  },
  props: {
    modelId: groqAiProps.modelId({
      required: true,
      description: 'Text-to-speech model ID: "canopylabs/orpheus-v1-english" or "canopylabs/orpheus-arabic-saudi".',
    }),
    input: Property.LongText({
      displayName: 'Text',
      description: 'The text to speak.',
      required: true,
    }),
    voice: Property.ShortText({
      displayName: 'Voice',
      description: 'Voice name for the model, e.g. "troy", "austin" or "hannah" for English.',
      required: true,
    }),
    responseFormat: Property.StaticDropdown({
      displayName: 'Audio Format',
      description: 'flac, mp3, mulaw, ogg or wav. Defaults to wav.',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'WAV', value: 'wav' },
          { label: 'MP3', value: 'mp3' },
          { label: 'FLAC', value: 'flac' },
          { label: 'OGG', value: 'ogg' },
          { label: 'mu-law', value: 'mulaw' },
        ],
      },
    }),
    sampleRate: Property.Number({
      displayName: 'Sample Rate',
      description: 'Sample rate in Hz: 8000, 16000, 22050, 24000, 32000, 44100 or 48000.',
      required: false,
    }),
    speed: Property.Number({
      displayName: 'Speed',
      description: 'Playback speed of the generated audio. 1 is normal.',
      required: false,
    }),
  },
  async run({ auth, propsValue, files }) {
    const format = propsValue.responseFormat ?? 'wav';
    const audio = await groqClient.requestBuffer({
      auth,
      method: HttpMethod.POST,
      path: '/audio/speech',
      body: {
        model: propsValue.modelId,
        input: propsValue.input,
        voice: propsValue.voice,
        response_format: format,
        sample_rate: propsValue.sampleRate,
        speed: propsValue.speed,
      },
    });
    const fileName = `speech.${format}`;
    const file = await files.write({ fileName, data: audio });
    return { file, fileName, format, size: audio.length };
  },
});
