import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { cometApiAuth } from '../../../auth';
import { cometApiAiProps } from '../../../common/ai-props';
import { cometApiClient } from '../../../common/client';
import { cometapiKlingAddVideoSelectionOutputSchema } from '../../../output-schemas';

export const klingDeleteVideoSelectionAction = createAction({
  auth: cometApiAuth,
  name: 'cometapi_kling_delete_video_selection',
  outputSchema: cometapiKlingAddVideoSelectionOutputSchema,
  displayName: 'Kling Delete Video Selection',
  description:
    'Removes selection points from one frame of a Kling multi-element editing session.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Removes the given selection points (x and y from 0 to 1) on one frame of a Kling multi-element editing session; it only edits the session. Takes the session_id from Kling Init Video Selection; use Kling Clear Video Selection to drop every point instead.',
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
      path: '/kling/v1/videos/multi-elements/delete-selection',
      body: {
        session_id: propsValue.sessionId,
        frame_index: propsValue.frameIndex,
        points: propsValue.points,
      },
    });
  },
});
