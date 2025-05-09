import { zohoMailAuth } from '../../index';
import { Property, createAction, OAuth2PropertyValue } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient, HttpMessageBody, QueryParams } from '@activepieces/pieces-common';
import { ZOHO_MAIL_API_URL, fetchAccounts, fetchFolders } from '../common';

export const getEmailDetails = createAction({
  auth: zohoMailAuth,
  name: 'get_email_details',
  displayName: 'Get Email Details',
  description: 'Retrieve full content and metadata of a specific email.',
  props: {
    accountId: Property.Dropdown({
      displayName: 'Account ID',
      description: 'Select the Zoho Mail Account ID.',
      required: true,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) return { disabled: true, placeholder: 'Please authenticate first', options: [] };
        const accounts = await fetchAccounts(auth as OAuth2PropertyValue);
        if (accounts.length === 0) return { disabled: true, placeholder: 'No accounts found', options: [] };
        return { disabled: false, options: accounts };
      },
    }),
    folderId: Property.Dropdown({
      displayName: 'Folder ID',
      description: 'Select the Folder containing the email.',
      required: true,
      refreshers: ['accountId'],
      options: async ({ auth, accountId }) => {
        if (!auth || !accountId) return { disabled: true, placeholder: 'Select an account first', options: [] };
        const folders = await fetchFolders(auth as OAuth2PropertyValue, accountId as string);
        if (folders.length === 0) return { disabled: true, placeholder: 'No folders found', options: [] };
        return { disabled: false, options: folders };
      },
    }),
    messageId: Property.ShortText({
      displayName: 'Message ID',
      description: 'The ID of the email message to retrieve.',
      required: true,
    }),
    includeBlockContentForContent: Property.Checkbox({
      displayName: 'Include Block Content (for Email Body)',
      description: 'Whether to include block quote content along with the email body.',
      required: false,
      defaultValue: false,
    }),
    includeInlineForAttachmentInfo: Property.Checkbox({
      displayName: 'Include Inline Images (for Attachment Info)',
      description: 'Whether to include inline image information in the attachment details.',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const { accountId, folderId, messageId, includeBlockContentForContent, includeInlineForAttachmentInfo } = context.propsValue;
    const accessToken = context.auth.access_token;

    const headers = {
      'Authorization': `Zoho-oauthtoken ${accessToken}`,
    };

    // 1. Get Metadata
    const metadataResponse = await httpClient.sendRequest<HttpMessageBody>({
      method: HttpMethod.GET,
      url: `${ZOHO_MAIL_API_URL}/accounts/${accountId}/folders/${folderId}/messages/${messageId}/details`,
      headers,
    });

    // 2. Get Content
    const contentQueryParams: QueryParams = {};
    if (includeBlockContentForContent) {
      contentQueryParams['includeBlockContent'] = 'true';
    }
    const contentResponse = await httpClient.sendRequest<HttpMessageBody>({
      method: HttpMethod.GET,
      url: `${ZOHO_MAIL_API_URL}/accounts/${accountId}/folders/${folderId}/messages/${messageId}/content`,
      headers,
      queryParams: contentQueryParams,
    });

    // 3. Get Attachment Info
    const attachmentInfoQueryParams: QueryParams = {};
    if (includeInlineForAttachmentInfo) {
      attachmentInfoQueryParams['includeInline'] = 'true';
    }
    const attachmentInfoResponse = await httpClient.sendRequest<HttpMessageBody>({
      method: HttpMethod.GET,
      url: `${ZOHO_MAIL_API_URL}/accounts/${accountId}/folders/${folderId}/messages/${messageId}/attachmentinfo`,
      headers,
      queryParams: attachmentInfoQueryParams,
    });

    return {
      metadata: metadataResponse.body,
      content: contentResponse.body,
      attachments: attachmentInfoResponse.body,
    };
  },
});
