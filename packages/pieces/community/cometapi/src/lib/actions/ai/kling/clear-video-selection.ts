import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { cometApiAuth } from '../../../auth';
import { cometApiAiProps } from '../../../common/ai-props';
import { cometApiClient } from '../../../common/client';
import { cometapiKlingAddVideoSelectionOutputSchema } from '../../../output-schemas';

export const klingClearVideoSelectionAction = createAction({
  auth: cometApiAuth,
  name: 'cometapi_kling_clear_video_selection',
  outputSchema: cometapiKlingAddVideoSelectionOutputSchema,
  displayName: 'Kling Clear Video Selection',
  description:
    'Clears every selection point in a Kling multi-element editing session.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Clears all selection points of a Kling multi-element editing session so the region can be rebuilt with Kling Add Video Selection. Takes the session_id from Kling Init Video Selection; use Kling Delete Video Selection to remove only some points.',
    idempotent: true,
  },
  props: {
    sessionId: cometApiAiProps.klingSessionId({ required: true }),
  },
  async run({ auth, propsValue }) {
    return await cometApiClient.request({
      auth,
      method: HttpMethod.POST,
      host: 'root',
      path: '/kling/v1/videos/multi-elements/clear-selection',
      body: { session_id: propsValue.sessionId },
    });
  },
});
