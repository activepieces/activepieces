import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  AuthenticationType
} from '@activepieces/pieces-common';
import { excelAuth } from '../auth';
import { commonProps } from '../common/props';
import { getDrivePath } from '../common/helpers';
import { excelCommon } from '../common/common';

export const clearColumnAction = createAction({
  auth: excelAuth,
  name: 'clear_column',
  displayName: 'Clear Column by Index',
  description: 'Clear contents/formatting of a column by its index.',
  props: {
    storageSource: commonProps.storageSource,
    siteId: commonProps.siteId,
    documentId: commonProps.documentId,
    workbookId: commonProps.workbookId,
    worksheetId: commonProps.worksheetId,
    column_index: Property.Number({
      displayName: 'Column Index',
      description:
        'The 1-based index of the column to be cleared (e.g., 1 for column A, 2 for column B).',
      required: true
    }),
    applyTo: Property.StaticDropdown({
      displayName: 'Clear Type',
      description: 'Specify what to clear from the column.',
      required: true,
      defaultValue: 'All',
      options: {
        options: [
          {
            label: 'All (Contents and Formatting)',
            value: 'All'
          },
          {
            label: 'Contents Only',
            value: 'Contents'
          },
          {
            label: 'Formats Only',
            value: 'Formats'
          }
        ]
      }
    })
  },
  async run(context) {
    const { storageSource, siteId, documentId, workbookId, worksheetId, column_index, applyTo } =
      context.propsValue;
    const { access_token } = context.auth;

    if (storageSource === 'sharepoint' && (!siteId || !documentId)) {
      throw new Error('please select SharePoint site and document library.');
    }
    const drivePath = getDrivePath(storageSource, siteId as string, documentId as string);

    if (
      typeof column_index !== 'number' ||
      !Number.isInteger(column_index) ||
      column_index < 1
    ) {
      throw new Error('Column index must be a positive integer.');
    }

    // Convert 1-based index to Excel column letter (e.g., 1 -> 'A')
    const columnLetter = excelCommon.numberToColumnName(column_index);

    // Construct the range address for the entire column, e.g., 'C:C'
    const columnAddress = `${columnLetter}:${columnLetter}`;

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${drivePath}/items/${workbookId}/workbook/worksheets/${worksheetId}/range(address='${columnAddress}')/clear`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: access_token
      },
      body: {
        applyTo: applyTo
      }
    });

    // A successful request returns a 200 OK with no body.
    return response.body;
  }
});
