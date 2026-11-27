import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { boxAuth } from '../../../auth';
import { boxAiProps } from '../../../common/ai-props';
import { boxClient } from '../../../common/client';

export const resendSignRequestAction = createAction({
  auth: boxAuth,
  name: 'box_resend_sign_request',
  displayName: 'Resend Sign Request',
  description: 'Resends the Box Sign request email to signers who have not signed yet.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Emails the Box Sign request again to every signer who has not signed yet; each call sends new emails. Get the ID from List Sign Requests or Create Sign Request.',
    idempotent: false,
  },
  props: {
    signRequestId: boxAiProps.signRequestId({ required: true }),
  },
  async run({ auth, propsValue }) {
    await boxClient.request<unknown>({
      auth,
      method: HttpMethod.POST,
      path: `/sign_requests/${encodeURIComponent(propsValue.signRequestId)}/resend`,
    });
    return { resent: true, signRequestId: propsValue.signRequestId };
  },
});
