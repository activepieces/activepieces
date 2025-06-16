import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { smartsheetApiCall } from '../common/client';
import { smartsheetAuth } from '../../index';

export const findAttachmentByRowId = createAction({
  auth: smartsheetAuth,
  name: 'find_attachment_by_row_id',
  displayName: 'Find Attachment by Row ID',
  description: 'Access related documents for a task or entry.',
  props: {
    sheetId: Property.Number({
      displayName: 'Sheet ID',
      required: true,
    }),
    rowId: Property.Number({
      displayName: 'Row ID',
      required: true,
    }),
    page: Property.Number({
      displayName: 'Page',
      description: 'Which page to return. Defaults to 1.',
      required: false,
      defaultValue: 1,
    }),
    pageSize: Property.Number({
      displayName: 'Page Size',
      description:
        'Maximum number of items to return per page. Defaults to 100.',
      required: false,
      defaultValue: 100,
    }),
    includeAll: Property.Checkbox({
      displayName: 'Include All',
      description: 'If true, include all results without pagination.',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const { sheetId, rowId, page, pageSize, includeAll } = context.propsValue;
    const { apiKey, region } = context.auth;

    const queryParams = new URLSearchParams();
    if (!includeAll) {
      if (page) queryParams.append('page', page.toString());
      if (pageSize) queryParams.append('pageSize', pageSize.toString());
    } else {
      queryParams.append('includeAll', 'true');
    }

    const response = await smartsheetApiCall({
      apiKey,
      region: region as 'default' | 'gov' | 'eu' | 'au' | undefined,
      method: HttpMethod.GET,
      resourceUri: `/sheets/${sheetId}/rows/${rowId}/attachments?${queryParams.toString()}`,
    });

    return response;
  },
});
