import { createAction, Property } from '@activepieces/pieces-framework';
import { smartsheetApiCall } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';
import { sheetDropdown } from '../common/props';
import { smartsheetAuth } from '../../index';

export const findUpdatedRow = createAction({
  auth: smartsheetAuth,
  name: 'find-updated-row',
  displayName: 'Find Updated Row',
  description: 'Track row updates for auditing or synchronization purposes.',
  props: {
    sheetId: sheetDropdown(true),
    rowId: Property.Number({
      displayName: 'Row ID',
      description: 'The ID of the row to check for updates.',
      required: true,
    }),
  },

  async run(context) {
    const { apiKey, region } = context.auth as { apiKey: string; region: string };
    const { sheetId, rowId } = context.propsValue;

    const rowResponse = await smartsheetApiCall<{
      row: {
        id: number;
        cells: { columnId: number; value: unknown; displayValue: unknown }[];
        modifiedAt: string;
      };
    }>({
      apiKey,
      region: region as 'default' | 'gov' | 'eu' | 'au' | undefined,
      method: HttpMethod.GET,
      resourceUri: `/sheets/${sheetId}/rows/${rowId}`,
    });

    return {
      rowId: rowResponse.row.id,
      lastModified: rowResponse.row.modifiedAt,
      cells: rowResponse.row.cells.map(cell => ({
        columnId: cell.columnId,
        value: cell.value,
        displayValue: cell.displayValue,
      })),
    };
  },
});
