import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { cometApiAuth } from '../../../auth';
import { cometApiAiProps } from '../../../common/ai-props';
import { cometApiClient } from '../../../common/client';
import { cometApiUtils } from '../../../common/utils';
import { cometapiRunwayCharacterPerformanceOutputSchema } from '../../../output-schemas';

const MODELS = [
  'eleven_multilingual_v2',
  'eleven_v3',
  'eleven_v4',
  'seed_audio',
];

export const runwayTextToSpeechAction = createAction({
  auth: cometApiAuth,
  name: 'cometapi_runway_text_to_speech',
  outputSchema: cometapiRunwayCharacterPerformanceOutputSchema,
  displayName: 'Runway Text to Speech',
  description: 'Starts a Runway speech generation from text.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Starts an async Runway text-to-speech task and returns the task id; poll it with Runway Get Task for the audio URL. The eleven_* models need a Preset Voice; seed_audio takes an optional Reference Audio URL instead, never both; use Runway Speech to Speech to revoice an existing recording. Each call is a billed generation.',
    idempotent: false,
  },
  props: {
    model: Property.StaticDropdown({
      displayName: 'Model',
      description:
        'eleven_multilingual_v2 (1,000 chars), eleven_v3 (5,000 chars, [tags]), eleven_v4 ([tags]) or seed_audio (2,048 chars).',
      required: true,
      options: {
        options: cometApiUtils.toOptions({ values: MODELS }),
      },
    }),
    promptText: Property.LongText({
      displayName: 'Text',
      description:
        'The text to speak. eleven_v3 and eleven_v4 accept expressive tags such as [whispers] or [laughs].',
      required: true,
    }),
    presetVoice: cometApiAiProps.runwayPresetVoice({
      required: false,
      description:
        'Runway preset voice. Required for the eleven_* models; not used with seed_audio.',
    }),
    referenceAudioUri: Property.ShortText({
      displayName: 'Reference Audio URL',
      description:
        'seed_audio only: a voice sample as a public HTTPS URL or a Base64 audio data URI up to 5 MB. Leave empty for the default voice.',
      required: false,
    }),
    additionalFields: cometApiAiProps.additionalFields({
      required: false,
      description:
        'Other model-specific body fields as a JSON object, e.g. stability, similarityBoost, style, speed, useSpeakerBoost, languageCode, seed (eleven_v3/v4), applyTextNormalization (eleven_v3), previousText, nextText (eleven_v4), speechRate, loudnessRate, pitchRate, sampleRate, outputFormat (seed_audio).',
    }),
  },
  async run({ auth, propsValue }) {
    const { model, presetVoice, referenceAudioUri } = propsValue;
    if (!MODELS.includes(model)) {
      throw new Error(`Model must be one of: ${MODELS.join(', ')}.`);
    }
    if (presetVoice && referenceAudioUri) {
      throw new Error(
        'Set either Preset Voice or Reference Audio URL, not both.'
      );
    }
    return await cometApiClient.request({
      auth,
      method: HttpMethod.POST,
      host: 'root',
      path: '/runwayml/v1/text_to_speech',
      body: cometApiUtils.withAdditionalFields({
        additionalFields: propsValue.additionalFields,
        fields: {
          model,
          promptText: propsValue.promptText,
          voice: presetVoice
            ? { type: 'runway-preset', presetId: presetVoice }
            : referenceAudioUri
            ? { type: 'reference-audio', audioUri: referenceAudioUri }
            : undefined,
        },
      }),
    });
  },
});
