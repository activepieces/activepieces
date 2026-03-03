import { createAction } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  AuthenticationType,
} from '@activepieces/pieces-common';
import { commonProps } from '../common/props';
import { getDrivePath } from '../common/helpers';
import { excelAuth } from '../auth';

export const convertToRangeAction = createAction({
  auth: excelAuth,
  name: 'convert_to_range',
  description: 'Converts a table to a range',
  displayName: 'Convert to Range',
  props: {
    storageSource: commonProps.storageSource,
    siteId: commonProps.siteId,
    documentId: commonProps.documentId,
    workbookId: commonProps.workbookId,
    worksheetId: commonProps.worksheetId,
    tableId: commonProps.tableId,
  },
  async run({ propsValue, auth }) {
    const { storageSource, siteId, documentId, workbookId, worksheetId, tableId } = propsValue;

    if (storageSource === 'sharepoint' && (!siteId || !documentId)) {
      throw new Error('please select SharePoint site and document library.');
    }
    const drivePath = getDrivePath(storageSource, siteId as string, documentId as string);

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${drivePath}/items/${workbookId}/workbook/worksheets/${worksheetId}/tables/${tableId}/convertToRange`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: auth['access_token'],
      },
    });

    return response.body;
  },
});
