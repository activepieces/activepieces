import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { cometApiAuth } from '../../../auth';
import { cometApiAiProps } from '../../../common/ai-props';
import { cometApiClient } from '../../../common/client';
import { cometapiKlingAddVideoSelectionOutputSchema } from '../../../output-schemas';

export const klingAddVideoSelectionAction = createAction({
  auth: cometApiAuth,
  name: 'cometapi_kling_add_video_selection',
  outputSchema: cometapiKlingAddVideoSelectionOutputSchema,
  displayName: 'Kling Add Video Selection',
  description:
    'Marks points on one frame of a Kling multi-element editing session.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Adds up to 10 selection points (x and y from 0 to 1) on one frame of a Kling multi-element editing session, up to 10 marked frames per session. Takes the session_id from Kling Init Video Selection; check the result with Kling Preview Video Selection before Kling Create Multi-Element Video.',
    idempotent: false,
  },
  props: {
    sessionId: cometApiAiProps.klingSessionId({ required: true }),
    frameIndex: cometApiAiProps.klingFrameIndex({ required: true }),
    points: cometApiAiProps.klingPoints({}),
  },
  async run({ auth, propsValue }) {
    return await cometApiClient.request({
      auth,
      method: HttpMethod.POST,
      host: 'root',
      path: '/kling/v1/videos/multi-elements/add-selection',
      body: {
        session_id: propsValue.sessionId,
        frame_index: propsValue.frameIndex,
        points: propsValue.points,
      },
    });
  },
});
