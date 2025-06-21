import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { smartsheetApiCall } from '../common/client';
import { smartsheetAuth } from '../../index';

export const attachFileOrUrlToRowAction = createAction({
  auth: smartsheetAuth,
  name: 'attach_file_or_url_to_row',
  displayName: 'Attach File or URL to Row',
  description: 'Attaches a URL to a specified row in Smartsheet.',
  props: {
    sheetId: Property.Number({
      displayName: 'Sheet ID',
      required: true,
    }),
    rowId: Property.Number({
      displayName: 'Row ID',
      required: true,
    }),
    attachmentType: Property.StaticDropdown({
      displayName: 'Attachment Type',
      required: true,
      options: {
        options: [
          { label: 'Normal URL (LINK)', value: 'LINK' },
          { label: 'Box.com (BOX_COM)', value: 'BOX_COM' },
          { label: 'Dropbox (DROPBOX)', value: 'DROPBOX' },
          { label: 'Egnyte (EGNYTE)', value: 'EGNYTE' },
          { label: 'Evernote (EVERNOTE)', value: 'EVERNOTE' },
          { label: 'Google Drive (GOOGLE_DRIVE)', value: 'GOOGLE_DRIVE' },
          { label: 'OneDrive (ONEDRIVE)', value: 'ONEDRIVE' },
        ],
      },
    }),
    url: Property.ShortText({
      displayName: 'URL to Attach',
      required: true,
    }),
    name: Property.ShortText({
      displayName: 'Attachment Name',
      required: false,
      description: 'Optional name to display for the attachment. If not provided, the URL will be used.',
    }),
  },
  async run(context) {
    const { sheetId, rowId, attachmentType, url, name } = context.propsValue;
    const { apiKey, region } = context.auth;

    const body = {
      name: name || url,
      url,
      attachmentType,
    };

    const response = await smartsheetApiCall({
      apiKey,
      region: region as 'default' | 'gov' | 'eu' | 'au' | undefined,
      method: HttpMethod.POST,
      resourceUri: `/sheets/${sheetId}/rows/${rowId}/attachments`,
      body,
    });

    return response;
  },
});
