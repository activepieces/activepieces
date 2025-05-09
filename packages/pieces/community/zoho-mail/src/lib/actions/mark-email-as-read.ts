import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { zohoMailAuth } from '../../index';
import { zohoMailCommon } from '../common';

export const markEmailAsRead = createAction({
  name: 'mark_email_as_read',
  displayName: 'Mark Email as Read',
  description: 'Mark an email or multiple emails as read',
  auth: zohoMailAuth,
  props: {
    messageIds: Property.Array({
      displayName: 'Message IDs',
      description: 'IDs of the messages to mark as read',
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
      mode: 'markAsRead',
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