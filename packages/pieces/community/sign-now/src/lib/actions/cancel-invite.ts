import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { signNowAuth, getSignNowBearerToken } from '../common/auth';

export const cancelInviteAction = createAction({
  auth: signNowAuth,
  name: 'cancel_invite',
  displayName: 'Cancel Invite to Sign',
  description: 'Cancels an invite to sign a document.',
  props: {
    document_id: Property.ShortText({
      displayName: 'Document ID',
      description: 'The ID of the document whose invite you want to cancel.',
      required: true,
    }),
    reason: Property.ShortText({
      displayName: 'Cancellation Reason',
      description: 'The reason for cancelling the invite.',
      required: true,
    }),
  },
  async run(context) {
    const { document_id, reason } = context.propsValue;
    const token = getSignNowBearerToken(context.auth);

    const response = await httpClient.sendRequest({
      method: HttpMethod.PUT,
      url: `https://api.signnow.com/document/${document_id}/fieldinvitecancel`,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: { reason },
    });

    return response.body;
  },
});
