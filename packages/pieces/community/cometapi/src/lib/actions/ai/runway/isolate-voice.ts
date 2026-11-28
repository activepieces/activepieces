import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { cometApiAuth } from '../../../auth';
import { cometApiClient } from '../../../common/client';
import { cometapiRunwayCharacterPerformanceOutputSchema } from '../../../output-schemas';

export const runwayIsolateVoiceAction = createAction({
  auth: cometApiAuth,
  name: 'cometapi_runway_isolate_voice',
  outputSchema: cometapiRunwayCharacterPerformanceOutputSchema,
  displayName: 'Runway Isolate Voice',
  description:
    'Starts a Runway task that separates speech from background audio.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Starts an async Runway voice isolation task (eleven_voice_isolation) that strips background sound from a recording, keeping only the speech, and returns the task id; poll it with Runway Get Task for the cleaned audio URL. Each call is a billed generation.',
    idempotent: false,
  },
  props: {
    audioUri: Property.ShortText({
      displayName: 'Audio URL',
      description:
        'The recording to clean: a public HTTPS URL or a Base64 audio data URI up to 5 MB.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    return await cometApiClient.request({
      auth,
      method: HttpMethod.POST,
      host: 'root',
      path: '/runwayml/v1/voice_isolation',
      body: {
        model: 'eleven_voice_isolation',
        audioUri: propsValue.audioUri,
      },
    });
  },
});
