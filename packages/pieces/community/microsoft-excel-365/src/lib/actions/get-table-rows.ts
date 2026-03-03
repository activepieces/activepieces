import { createAction, Property } from '@activepieces/pieces-framework';
import { commonProps } from '../common/props';
import { excelAuth } from '../auth';
import { getDrivePath } from '../common/helpers';
import { excelCommon } from '../common/common';
import {
  httpClient,
  HttpMethod,
  AuthenticationType,
} from '@activepieces/pieces-common';

export const getTableRowsAction = createAction({
  auth: excelAuth,
  name: 'get_table_rows',
  description: 'List rows of a table in a worksheet',
  displayName: 'Get Table Rows',
  props: {
    storageSource: commonProps.storageSource,
    siteId: commonProps.siteId,
    documentId: commonProps.documentId,
    workbookId: commonProps.workbookId,
    worksheetId: commonProps.worksheetId,
    tableId: commonProps.tableId,
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Limit the number of rows retrieved',
      required: false,
    }),
  },
  async run({ propsValue, auth }) {
    const { storageSource, siteId, documentId, workbookId, worksheetId, tableId } = propsValue;
    const limit = propsValue['limit'];

    if (storageSource === 'sharepoint' && (!siteId || !documentId)) {
      throw new Error('please select SharePoint site and document library.');
    }
    const drivePath = getDrivePath(storageSource, siteId as string, documentId as string);

    let url = `${drivePath}/items/${workbookId}/workbook/worksheets/${worksheetId}/tables/${tableId}/rows`;

    if (limit) {
      url += `?$top=${limit}`;
    }

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: url,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: auth['access_token'],
      },
    });

    const rowsValues = response.body['value'].map(
      (row: { values: any[] }) => row.values[0]
    );

    return rowsValues;
  },
});
