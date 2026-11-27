import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { cometApiAuth } from '../../../auth';
import { cometApiAiProps } from '../../../common/ai-props';
import { cometApiClient } from '../../../common/client';
import { cometapiKlingAddVideoSelectionOutputSchema } from '../../../output-schemas';

export const klingPreviewVideoSelectionAction = createAction({
  auth: cometApiAuth,
  name: 'cometapi_kling_preview_video_selection',
  outputSchema: cometapiKlingAddVideoSelectionOutputSchema,
  displayName: 'Kling Preview Video Selection',
  description:
    'Previews the selected region of a Kling multi-element editing session.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Renders a preview of the region currently selected in a Kling multi-element editing session, to verify it before the billed Kling Create Multi-Element Video. Takes the session_id from Kling Init Video Selection after Kling Add Video Selection.',
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
      path: '/kling/v1/videos/multi-elements/preview-selection',
      body: { session_id: propsValue.sessionId },
    });
  },
});
