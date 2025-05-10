import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { zohoMailAuth } from '../../index';
import { zohoMailCommon } from '../common';

export const getEmailDetails = createAction({
  name: 'get_email_details',
  displayName: 'Get Email Details',
  description: 'Retrieve full content and metadata of a specific email',
  auth: zohoMailAuth,
  props: {
    folderId: Property.ShortText({
      displayName: 'Folder ID',
      description: 'ID of the folder containing the email',
      required: true,
    }),
    messageId: Property.ShortText({
      displayName: 'Message ID',
      description: 'ID of the message to retrieve',
      required: true,
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;
    const { folderId, messageId } = propsValue;
    const typedAuth = auth as any;
    const region = typedAuth.props?.region;
    const accountId = typedAuth.data?.accountId || 'self';
    
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: zohoMailCommon.getFullUrl(region, accountId, `/folders/${folderId}/messages/${messageId}/details`),
      headers: zohoMailCommon.authHeaders(typedAuth.access_token),
    });
    
    return response.body;
  },
});