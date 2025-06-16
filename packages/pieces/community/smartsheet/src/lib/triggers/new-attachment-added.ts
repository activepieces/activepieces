import { createAction } from '@activepieces/pieces-framework';
import { smartsheetApiCall } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';
import { sheetDropdown } from '../common/props';
import { smartsheetAuth } from '../../index';

export const findNewAttachments = createAction({
  auth: smartsheetAuth,
  name: 'find-new-attachments',
  displayName: 'Find New Attachments',
  description: 'Fetch the list of attachments added to a specific sheet.',
  props: {
    sheetId: sheetDropdown(true),
  },

  async run(context) {
    const { apiKey, region } = context.auth as { apiKey: string; region: string };
    const { sheetId } = context.propsValue;

    const response = await smartsheetApiCall<{
      data: {
        id: number;
        name: string;
        createdAt: string;
        parentId: number;
        parentType: string;
        url: string;
      }[];
    }>({
      apiKey,
      region: region as 'default' | 'gov' | 'eu' | 'au' | undefined,
      method: HttpMethod.GET,
      resourceUri: `/sheets/${sheetId}/attachments`,
    });

    return response.data.map(attachment => ({
      attachmentId: attachment.id,
      name: attachment.name,
      createdAt: attachment.createdAt,
      parentId: attachment.parentId,
      parentType: attachment.parentType,
      url: attachment.url,
    }));
  },
});
