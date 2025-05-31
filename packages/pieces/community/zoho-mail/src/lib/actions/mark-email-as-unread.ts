import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { zohoMailAuth } from '../../index';
import { zohoMailCommon } from '../common';

export const markEmailAsUnread = createAction({
  name: 'mark_email_as_unread',
  displayName: 'Mark Email as Unread',
  description: 'Mark an email or multiple emails as unread',
  auth: zohoMailAuth,
  props: {
    messageIds: Property.Array({
      displayName: 'Message IDs',
      description: 'IDs of the messages to mark as unread',
      required: true,
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;
    const { messageIds } = propsValue;
    const typedAuth = auth as any;
    const region = typedAuth.props?.region;
    const accountId = typedAuth.data?.accountId || 'self';
    
    const requestBody = {
      mode: 'markAsUnread',
      messageId: messageIds,
    };
    
    const response = await httpClient.sendRequest({
      method: HttpMethod.PUT,
      url: zohoMailCommon.getFullUrl(region, accountId, '/updatemessage'),
      headers: zohoMailCommon.authHeaders(typedAuth.access_token),
      body: requestBody,
    });
    
    return response.body;
  },
});