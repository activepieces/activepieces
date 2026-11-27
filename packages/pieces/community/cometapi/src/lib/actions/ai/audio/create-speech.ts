import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { cometApiAuth } from '../../../auth';
import { cometApiUtils } from '../../../common/utils';
import { cometApiAiProps } from '../../../common/ai-props';
import { cometApiClient } from '../../../common/client';
import { cometapiCreateSpeechOutputSchema } from '../../../output-schemas';

const VOICES = [
  'alloy',
  'ash',
  'ballad',
  'coral',
  'echo',
  'fable',
  'onyx',
  'nova',
  'sage',
  'shimmer',
];
const FORMATS = ['mp3', 'opus', 'aac', 'flac', 'wav', 'pcm'];

export const createSpeechAction = createAction({
  auth: cometApiAuth,
  name: 'cometapi_create_speech',
  outputSchema: cometapiCreateSpeechOutputSchema,
  displayName: 'Create Speech',
  description: 'Turns text into spoken audio.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Synthesizes speech from text with an OpenAI-compatible TTS model (e.g. tts-1, gpt-4o-mini-tts) and stores the audio as a file, returning its reference and format. Use Create Transcription for the reverse. Each call is a billed generation.',
    idempotent: false,
  },
  props: {
    model: cometApiAiProps.model({
      required: true,
      description:
        'Text-to-speech model ID, e.g. "tts-1". Use List Models with feature text-to-speech.',
    }),
    input: Property.LongText({
      displayName: 'Input',
      description: 'The text to speak.',
      required: true,
    }),
    voice: Property.StaticDropdown({
      displayName: 'Voice',
      required: true,
      options: {
        options: cometApiUtils.toOptions({ values: VOICES }),
      },
    }),
    responseFormat: Property.StaticDropdown({
      displayName: 'Audio Format',
      description: 'Defaults to mp3.',
      required: false,
      options: {
        options: cometApiUtils.toOptions({ values: FORMATS }),
      },
    }),
    speed: Property.Number({
      displayName: 'Speed',
      description: 'Playback speed from 0.25 to 4.0. Defaults to 1.0.',
      required: false,
    }),
  },
  async run({ auth, propsValue, files }) {
    const format = propsValue.responseFormat ?? 'mp3';
    const audio = await cometApiClient.request<ArrayBuffer>({
      auth,
      method: HttpMethod.POST,
      path: '/audio/speech',
      body: {
        model: propsValue.model,
        input: propsValue.input,
        voice: propsValue.voice,
        response_format: propsValue.responseFormat,
        speed: propsValue.speed,
      },
      responseType: 'arraybuffer',
    });
    const file = await files.write({
      fileName: `speech.${format}`,
      data: Buffer.from(audio),
    });
    return { file, format };
  },
});
