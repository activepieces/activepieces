import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { zohoMailAuth } from '../../index';
import { zohoMailCommon } from '../common';

export const moveEmailToFolder = createAction({
  name: 'move_email_to_folder',
  displayName: 'Move Email to Folder',
  description: 'Move an email or multiple emails to a specific folder',
  auth: zohoMailAuth,
  props: {
    messageIds: Property.Array({
      displayName: 'Message IDs',
      description: 'IDs of the messages to move',
      required: true,
    }),
    folderId: Property.ShortText({
      displayName: 'Folder ID',
      description: 'ID of the destination folder',
      required: true,
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;
    const { messageIds, folderId } = propsValue;
    const typedAuth = auth as any;
    const region = typedAuth.props?.region;
    const accountId = typedAuth.data?.accountId || 'self';
    
    const requestBody = {
      mode: 'moveMessages',
      messageId: messageIds,
      toFolder: folderId,
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