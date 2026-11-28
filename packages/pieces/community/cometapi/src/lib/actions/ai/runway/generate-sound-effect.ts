import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { cometApiAuth } from '../../../auth';
import { cometApiAiProps } from '../../../common/ai-props';
import { cometApiClient } from '../../../common/client';
import { cometApiUtils } from '../../../common/utils';
import { cometapiRunwayCharacterPerformanceOutputSchema } from '../../../output-schemas';

const MODELS = ['eleven_text_to_sound_v2', 'seed_audio'];

export const runwayGenerateSoundEffectAction = createAction({
  auth: cometApiAuth,
  name: 'cometapi_runway_generate_sound_effect',
  outputSchema: cometapiRunwayCharacterPerformanceOutputSchema,
  displayName: 'Runway Generate Sound Effect',
  description:
    'Starts a Runway sound effect or audio scene generation from a text prompt.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Starts an async Runway sound effect or audio scene generation from a text prompt and returns the task id; poll it with Runway Get Task for the audio URL. Duration and Loop apply to eleven_text_to_sound_v2 only; seed_audio takes reference audios and rate controls through Additional Fields, and Runway Text to Speech fits spoken text better. Each call is a billed generation.',
    idempotent: false,
  },
  props: {
    model: Property.StaticDropdown({
      displayName: 'Model',
      description:
        'eleven_text_to_sound_v2 (prompt up to 3,000 chars) or seed_audio (up to 2,048 chars, audio scenes with references).',
      required: true,
      options: {
        options: cometApiUtils.toOptions({ values: MODELS }),
      },
    }),
    promptText: Property.LongText({
      displayName: 'Prompt',
      description:
        'The sound to generate. With seed_audio, cite reference audios as @Audio1, @Audio2, @Audio3.',
      required: true,
    }),
    duration: Property.Number({
      displayName: 'Duration',
      description:
        'eleven_text_to_sound_v2 only: length in seconds, 0.5 to 30, fractions allowed. Leave empty to infer it from the prompt.',
      required: false,
    }),
    loop: cometApiAiProps.booleanChoice({
      required: false,
      displayName: 'Loop',
      description:
        'eleven_text_to_sound_v2 only: true requests a seamlessly looping sound. Defaults to false.',
    }),
    additionalFields: cometApiAiProps.additionalFields({
      required: false,
      description:
        'Other body fields as a JSON object. seed_audio accepts referenceAudios (up to three HTTPS URLs or audio data URIs), speechRate, loudnessRate, pitchRate, sampleRate and outputFormat (wav, mp3, ogg_opus).',
    }),
  },
  async run({ auth, propsValue }) {
    if (!MODELS.includes(propsValue.model)) {
      throw new Error(`Model must be one of: ${MODELS.join(', ')}.`);
    }
    return await cometApiClient.request({
      auth,
      method: HttpMethod.POST,
      host: 'root',
      path: '/runwayml/v1/sound_effect',
      body: cometApiUtils.withAdditionalFields({
        additionalFields: propsValue.additionalFields,
        fields: {
          model: propsValue.model,
          promptText: propsValue.promptText,
          duration: propsValue.duration,
          loop: cometApiUtils.toBoolean({ value: propsValue.loop }),
        },
      }),
    });
  },
});
