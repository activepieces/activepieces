import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  AuthenticationType,
} from '@activepieces/pieces-common';
import { excelAuth } from '../auth';
import { commonProps } from '../common/props';
import { getDrivePath } from '../common/helpers';
import { excelCommon } from '../common/common';

export const appendTableRowsAction = createAction({
  auth: excelAuth,
  name: 'append_table_rows',
  description: 'Append rows to a table',
  displayName: 'Append Rows to a Table',
  props: {
    storageSource: commonProps.storageSource,
    siteId: commonProps.siteId,
    documentId: commonProps.documentId,
    workbookId: commonProps.workbookId,
    worksheetId: commonProps.worksheetId,
    tableId: commonProps.tableId,
    values: excelCommon.table_values,
  },
  async run({ propsValue, auth }) {
    const { storageSource, siteId, documentId, workbookId, worksheetId, tableId } = propsValue;
    const valuesToAppend = [Object.values(propsValue['values'])];

    if (storageSource === 'sharepoint' && (!siteId || !documentId)) {
      throw new Error('please select SharePoint site and document library.');
    }
    const drivePath = getDrivePath(storageSource, siteId as string, documentId as string);

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${drivePath}/items/${workbookId}/workbook/worksheets/${worksheetId}/tables/${tableId}/rows`,
      body: {
        values: valuesToAppend,
      },
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: auth['access_token'],
      },
    });

    return response.body;
  },
});
