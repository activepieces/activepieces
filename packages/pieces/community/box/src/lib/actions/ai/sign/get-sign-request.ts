import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { boxAuth } from '../../../auth';
import { boxAiProps } from '../../../common/ai-props';
import { boxClient } from '../../../common/client';

export const getSignRequestAction = createAction({
  auth: boxAuth,
  name: 'box_get_sign_request',
  displayName: 'Get Sign Request',
  description: 'Gets a Box Sign request by ID.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Returns one Box Sign request with its status (e.g. sent, viewed, signed, declined, cancelled), signers and their progress, and the signed file IDs. Get the ID from List Sign Requests or Create Sign Request.',
    idempotent: true,
  },
  props: {
    signRequestId: boxAiProps.signRequestId({ required: true }),
  },
  async run({ auth, propsValue }) {
    return await boxClient.request({
      auth,
      method: HttpMethod.GET,
      path: `/sign_requests/${encodeURIComponent(propsValue.signRequestId)}`,
    });
  },
});
