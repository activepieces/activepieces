import { createAction, Property } from '@activepieces/pieces-framework';
import { gmailAuth } from '../../';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const removeLabelFromEmail = createAction({
  name: 'remove-label-from-email',
  displayName: 'Remove Label from Email',
  description: 'Removes a label from a Gmail message',
  auth: gmailAuth,
  props: {
    messageId: Property.ShortText({
      displayName: 'Message ID',
      required: true,
      description: 'ID of the Gmail message to update',
    }),
    labelId: Property.ShortText({
      displayName: 'Label ID',
      required: true,
      description: 'The label to remove',
    }),
  },
  async run(context) {
    const { messageId, labelId } = context.propsValue;

    const url = `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}/modify`;

    const body = {
      removeLabelIds: [labelId],
    };

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url,
      headers: {
        Authorization: `Bearer ${context.auth.access_token}`,
        'Content-Type': 'application/json',
      },
      body,
    });

    return response.body;
  },
});
