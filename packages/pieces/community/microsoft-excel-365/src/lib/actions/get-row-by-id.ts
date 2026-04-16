import { createAction, OAuth2PropertyValue, Property } from '@activepieces/pieces-framework';
import { excelAuth } from '../auth';
import { commonProps } from '../common/props';
import { getDrivePath, createMSGraphClient } from '../common/helpers';
import { excelCommon } from '../common/common';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const getRowAction = createAction({
  auth: excelAuth,
  name: 'getRowById',
  displayName: 'Get Row by ID',
  description: '  Retrieve the entire content of a row by its row ID.',
  props: {
    storageSource: commonProps.storageSource,
    siteId: commonProps.siteId,
    documentId: commonProps.documentId,
    workbookId: commonProps.workbookId,
    worksheetId: commonProps.worksheetId,
    tableId: commonProps.tableId,
    row_id: Property.Number({
      displayName: 'Row ID (Index)',
      description:
        'The zero-based index of the row to retrieve (e.g., 0 for the first row, 1 for the second).',
      required: true
    })
  },
  async run(context) {
    const { storageSource, siteId, documentId, workbookId, tableId, row_id } = context.propsValue;
    const { access_token } = context.auth;
    const cloud = (context.auth as OAuth2PropertyValue).props?.['cloud'] as string | undefined;

    if (storageSource === 'sharepoint' && (!siteId || !documentId)) {
      throw new Error('please select SharePoint site and document library.');
    }
    const drivePath = getDrivePath(storageSource, siteId as string, documentId as string);

    const maxRetries = 3;
    let attempt = 0;

    const client = createMSGraphClient(access_token, cloud);

    while (attempt < maxRetries) {
      try {
        const response = await client
          .api(`${drivePath}/items/${workbookId}/workbook/tables/${tableId}/rows/itemAt(index=${row_id})`)
          .get();
        return response;
      } catch (error: any) {
        if (error.statusCode === 503 && attempt < maxRetries - 1) {
          const delayMs = 2 ** attempt * 1000;
          console.warn(
            `Excel API is unavailable (503). Retrying after ${delayMs}ms... (Attempt ${
              attempt + 1
            }/${maxRetries})`
          );
          await delay(delayMs);
          attempt++;
        } else {
          throw error;
        }
      }
    }
    throw new Error(
      'Failed to retrieve row after multiple retries due to API unavailability.'
    );
  }
});
