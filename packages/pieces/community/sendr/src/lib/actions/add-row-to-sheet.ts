import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { sendrAuth } from '../auth';
import { sheetDropdown, sendrApiCall, flattenObject } from '../common';

export const addRowToSheet = createAction({
  auth: sendrAuth,
  name: 'add_row_to_sheet',
  displayName: 'Add Row to Sheet',
  description: 'Adds a new contact or record to a selected contact list (sheet).',
  props: {
    sheet: sheetDropdown,
    instructions: Property.MarkDown({
      value: `### How to Add a Row
1. Select the target sheet above.
2. Enter the row data below using column names as keys and the cell values as values.`,
    }),
    rowData: Property.Object({
      displayName: 'Row Data',
      description: 'Key-value pairs representing the new row. Keys should match the sheet column names. Example: { "Email": "john@example.com", "First Name": "John" }',
      required: true,
    }),
  },
  async run(context) {
    const response = await sendrApiCall<Record<string, unknown>>({
      token: context.auth as unknown as string,
      method: HttpMethod.POST,
      path: `/sheet/${context.propsValue.sheet}/row`,
      body: context.propsValue.rowData,
    });
    return flattenObject(response.body);
  },
});
