import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { boxAuth } from '../../../auth';
import { boxAiProps } from '../../../common/ai-props';
import { boxClient } from '../../../common/client';

export const cancelSignRequestAction = createAction({
  auth: boxAuth,
  name: 'box_cancel_sign_request',
  displayName: 'Cancel Sign Request',
  description: 'Cancels a Box Sign request.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description:
      'Cancels a Box Sign request that is not finished, so signers can no longer sign it; it cannot be reopened, only sent again with Create Sign Request. Get the ID from List Sign Requests or Create Sign Request.',
    idempotent: false,
  },
  props: {
    signRequestId: boxAiProps.signRequestId({ required: true }),
    reason: Property.LongText({
      displayName: 'Reason',
      description: 'Why the request is cancelled.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    return await boxClient.request({
      auth,
      method: HttpMethod.POST,
      path: `/sign_requests/${encodeURIComponent(propsValue.signRequestId)}/cancel`,
      body: propsValue.reason !== undefined ? { reason: propsValue.reason } : {},
    });
  },
});
