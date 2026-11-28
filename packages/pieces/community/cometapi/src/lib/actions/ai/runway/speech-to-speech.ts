import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { cometApiAuth } from '../../../auth';
import { cometApiUtils } from '../../../common/utils';
import { cometApiAiProps } from '../../../common/ai-props';
import { cometApiClient } from '../../../common/client';
import { cometapiRunwayCharacterPerformanceOutputSchema } from '../../../output-schemas';

const MEDIA_TYPES = ['audio', 'video'];

export const runwaySpeechToSpeechAction = createAction({
  auth: cometApiAuth,
  name: 'cometapi_runway_speech_to_speech',
  outputSchema: cometapiRunwayCharacterPerformanceOutputSchema,
  displayName: 'Runway Speech to Speech',
  description:
    'Starts a Runway task that revoices recorded dialogue with a preset voice.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Starts an async Runway voice conversion (eleven_multilingual_sts_v2) that re-speaks the dialogue in an audio or video file with a preset voice, and returns the task id; poll it with Runway Get Task. Use Runway Text to Speech when starting from text, or Runway Dub Voice to change the language. Each call is a billed generation.',
    idempotent: false,
  },
  props: {
    mediaType: Property.StaticDropdown({
      displayName: 'Media Type',
      description:
        'Whether Media URL is an audio file or a video containing dialogue.',
      required: true,
      options: {
        options: cometApiUtils.toOptions({ values: MEDIA_TYPES }),
      },
    }),
    mediaUri: Property.ShortText({
      displayName: 'Media URL',
      description:
        'The dialogue to convert: a public HTTPS URL or a Base64 audio/video data URI up to 5 MB.',
      required: true,
    }),
    presetVoice: cometApiAiProps.runwayPresetVoice({ required: true }),
    removeBackgroundNoise: cometApiAiProps.booleanChoice({
      required: false,
      displayName: 'Remove Background Noise',
      description:
        'true removes background noise from the generated speech; false is the same as leaving it empty.',
    }),
  },
  async run({ auth, propsValue }) {
    return await cometApiClient.request({
      auth,
      method: HttpMethod.POST,
      host: 'root',
      path: '/runwayml/v1/speech_to_speech',
      body: {
        model: 'eleven_multilingual_sts_v2',
        media: { type: propsValue.mediaType, uri: propsValue.mediaUri },
        voice: { type: 'runway-preset', presetId: propsValue.presetVoice },
        removeBackgroundNoise: cometApiUtils.toBoolean({
          value: propsValue.removeBackgroundNoise,
        }),
      },
    });
  },
});
