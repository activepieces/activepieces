import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { cometApiAuth } from '../../../auth';
import { cometApiUtils } from '../../../common/utils';
import { cometApiAiProps } from '../../../common/ai-props';
import { cometApiClient } from '../../../common/client';
import { cometapiRunwayCharacterPerformanceOutputSchema } from '../../../output-schemas';

const TARGET_LANGUAGES = [
  'en',
  'hi',
  'pt',
  'zh',
  'es',
  'fr',
  'de',
  'ja',
  'ar',
  'ru',
  'ko',
  'id',
  'it',
  'nl',
  'tr',
  'pl',
  'sv',
  'fil',
  'ms',
  'ro',
  'uk',
  'el',
  'cs',
  'da',
  'fi',
  'bg',
  'hr',
  'sk',
  'ta',
];

export const runwayDubVoiceAction = createAction({
  auth: cometApiAuth,
  name: 'cometapi_runway_dub_voice',
  outputSchema: cometapiRunwayCharacterPerformanceOutputSchema,
  displayName: 'Runway Dub Voice',
  description:
    'Starts a Runway task that dubs spoken audio into another language.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Starts an async Runway dubbing task (eleven_voice_dubbing) that translates the speech in an audio file into a target language, cloning the source voice by default, and returns the task id; poll it with Runway Get Task. Use Runway Speech to Speech to change the voice without translating. Each call is a billed generation.',
    idempotent: false,
  },
  props: {
    audioUri: Property.ShortText({
      displayName: 'Audio URL',
      description:
        'The speech to dub: a public HTTPS URL or a Base64 audio data URI up to 5 MB.',
      required: true,
    }),
    targetLang: Property.StaticDropdown({
      displayName: 'Target Language',
      description:
        'Language code to dub into, e.g. es for Spanish, fr for French.',
      required: true,
      options: {
        options: cometApiUtils.toOptions({ values: TARGET_LANGUAGES }),
      },
    }),
    disableVoiceCloning: cometApiAiProps.booleanChoice({
      required: false,
      displayName: 'Disable Voice Cloning',
      description:
        'true uses a generic voice instead of cloning the source voice; false is the same as leaving it empty.',
    }),
    dropBackgroundAudio: cometApiAiProps.booleanChoice({
      required: false,
      displayName: 'Drop Background Audio',
      description:
        'true removes background audio from the dubbed output; false is the same as leaving it empty.',
    }),
    numSpeakers: Property.Number({
      displayName: 'Number of Speakers',
      description:
        'Speakers in the source audio. Leave empty for automatic detection.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const { disableVoiceCloning, dropBackgroundAudio } = propsValue;
    return await cometApiClient.request({
      auth,
      method: HttpMethod.POST,
      host: 'root',
      path: '/runwayml/v1/voice_dubbing',
      body: {
        model: 'eleven_voice_dubbing',
        audioUri: propsValue.audioUri,
        targetLang: propsValue.targetLang,
        disableVoiceCloning: cometApiUtils.toBoolean({
          value: disableVoiceCloning,
        }),
        dropBackgroundAudio: cometApiUtils.toBoolean({
          value: dropBackgroundAudio,
        }),
        numSpeakers: propsValue.numSpeakers,
      },
    });
  },
});
