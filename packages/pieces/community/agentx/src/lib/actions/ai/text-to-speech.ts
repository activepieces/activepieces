import { createAction, Property } from '@activepieces/pieces-framework';

import { agentxAuth } from '../../auth';
import { agentxApi } from '../../common/api';

export const textToSpeechAction = createAction({
  auth: agentxAuth,
  name: 'agentx_text_to_speech',
  displayName: 'Text to Speech',
  description: 'Turns text into speech audio with AgentX.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Converts text into speech with the AgentX voice API and returns the audio as a base64 string. Language is detected when not set; voice defaults to female at speed 1.0.',
    idempotent: true,
  },
  props: {
    text: Property.LongText({
      displayName: 'Text',
      description: 'The text to speak.',
      required: true,
    }),
    language: Property.ShortText({
      displayName: 'Language',
      description:
        'Language code, e.g. "en". Detected from the text when empty.',
      required: false,
    }),
    gender: Property.StaticDropdown({
      displayName: 'Voice Gender',
      description: 'Voice gender. Defaults to female.',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'Female', value: 'female' },
          { label: 'Male', value: 'male' },
        ],
      },
    }),
    speed: Property.Number({
      displayName: 'Speed',
      description: 'Speaking speed. Defaults to 1.0.',
      required: false,
    }),
    accent: Property.StaticDropdown({
      displayName: 'Accent',
      description:
        'Accent, applied only to some languages. Supported: US, GB, ES, MX.',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'US', value: 'US' },
          { label: 'GB', value: 'GB' },
          { label: 'ES', value: 'ES' },
          { label: 'MX', value: 'MX' },
        ],
      },
    }),
    robot: Property.StaticDropdown({
      displayName: 'Robot Voice',
      description: 'Use a robot voice. Defaults to no.',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'Yes', value: true },
          { label: 'No', value: false },
        ],
      },
    }),
  },
  async run({ auth, propsValue }) {
    const { text, language, gender, speed, accent, robot } = propsValue;
    return await agentxApi.textToSpeech({
      auth,
      text,
      language,
      gender,
      speed,
      accent,
      robot,
    });
  },
});
