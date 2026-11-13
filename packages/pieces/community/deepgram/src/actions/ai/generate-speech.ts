import { createAction, Property } from '@activepieces/pieces-framework';
import { deepgramAuth } from '../../common/auth';
import { DEFAULT_AI_VOICE, TTS_ENCODING_OPTIONS } from '../../common/constants';
import { deepgramSpeech } from '../../common/speech';
import { generateSpeechOutputSchema } from '../../output-schemas';

const VOICE_PATTERN = /^aura(-2)?-[a-z]+-[a-z]{2}$/;

export const generateSpeechAction = createAction({
  auth: deepgramAuth,
  name: 'deepgram_generate_speech',
  classification: 'READ',
  displayName: 'Generate Speech',
  description: 'Converts text to an audio file with a Deepgram Aura voice ID.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Converts up to 2,000 characters of text to speech with a Deepgram Aura voice ID (default aura-2-thalia-en; Aura-2 voices exist for en, es, de, fr, nl, it and ja) and returns an audio file. Get voice IDs from deepgram_list_models with type tts. Each call is billed per character, so retries are billed again.',
    idempotent: false,
  },
  outputSchema: generateSpeechOutputSchema,
  props: {
    text: Property.LongText({
      displayName: 'Text',
      description: 'The text to speak, up to 2,000 characters.',
      required: true,
    }),
    voice: Property.ShortText({
      displayName: 'Voice ID',
      description: `A Deepgram voice ID such as ${DEFAULT_AI_VOICE} or aura-2-celeste-es. Leave empty for ${DEFAULT_AI_VOICE}.`,
      required: false,
    }),
    encoding: Property.StaticDropdown({
      displayName: 'Audio Format',
      required: false,
      defaultValue: 'mp3',
      options: { disabled: false, options: TTS_ENCODING_OPTIONS },
    }),
    speed: Property.Number({
      displayName: 'Speed',
      description:
        'Speaking rate from 0.5 to 1.5 (1 is normal). Not supported by every voice.',
      required: false,
    }),
  },
  async run(context) {
    const voice =
      (context.propsValue.voice ?? '').trim().toLowerCase() || DEFAULT_AI_VOICE;
    if (!VOICE_PATTERN.test(voice)) {
      throw new Error(
        `"${voice}" is not a Deepgram voice ID. Use an ID like ${DEFAULT_AI_VOICE}; deepgram_list_models (type tts) lists them all.`
      );
    }
    const encoding = context.propsValue.encoding ?? undefined;
    if (
      encoding &&
      !TTS_ENCODING_OPTIONS.some((option) => option.value === encoding)
    ) {
      throw new Error(
        `Unknown audio format "${encoding}". Use one of ${TTS_ENCODING_OPTIONS.map(
          (option) => option.value
        ).join(', ')}.`
      );
    }
    return deepgramSpeech.synthesize({
      apiKey: context.auth.secret_text,
      text: context.propsValue.text,
      model: voice,
      encoding,
      speed: context.propsValue.speed,
      writeFile: ({ fileName, data }) =>
        context.files.write({ fileName, data }),
    });
  },
});
