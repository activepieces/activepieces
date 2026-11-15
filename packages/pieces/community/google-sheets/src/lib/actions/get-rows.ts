import { Property, createAction, isNil } from '@activepieces/pieces-framework';
import { areSheetIdsValid, googleSheetsAuth } from '../common/common';
import * as z from 'zod/mini'
import { propsValidation } from '@activepieces/pieces-common';
import { nextRows } from '../common/next-rows';
import { commonProps } from '../common/props';
import { getNextRowsActionOutputSchema } from '../output-schemas';

const notes = `
**Notes:**

- The memory key remembers which row was processed last, and is reused on the following runs.
- Republishing the flow **keeps** the memory key value. To start over, **change** the memory key.
`
export const getRowsAction = createAction({
  auth: googleSheetsAuth,
  name: 'get_next_rows',
  classification: 'READ',
  description:
    'Read the next batch of rows from a worksheet, continuing where the last run left off. A batch of only blank rows returns an empty list mid-sheet, so do not stop at the first empty result.',
  audience: 'human',
  aiMetadata: {
    description:
      'Reads the next batch of rows from a worksheet, advancing a cursor stored under a memory key so successive calls walk through the sheet without reprocessing rows. Use to iterate a sheet in chunks across runs. Not idempotent — each non-test call moves the stored cursor forward and returns a different batch. A batch made only of blank rows returns an empty list even when more rows follow, so an empty result does not mean the end of the sheet.',
    idempotent: false,
  },
  displayName: 'Get Next Rows',
  propertyGroups: [
    {
      key: 'spreadsheet',
      display: 'section',
      label: 'Spreadsheet',
      icon: 'file',
      props: ['spreadsheetId', 'sheetId'],
    },
    {
      key: 'target_rows',
      display: 'section',
      label: 'Rows',
      icon: 'markdown',
      props: ['startRow', 'groupSize', 'headerRow'],
    },
    {
      key: 'memory',
      display: 'section',
      label: 'Memory',
      icon: 'inbox',
      props: ['markdown', 'memKey'],
    },
  ],
  props: {
    ...commonProps,
    startRow: Property.Number({
      displayName: 'Start Row',
      description: 'The row to start reading from on the first run.',
      required: true,
      defaultValue: 1,
    }),
    headerRow: Property.Number({
      displayName: 'Header Row',
      description: 'The row that contains the column names.',
      required: true,
      defaultValue: 1,
    }),
    useHeaderNames: Property.Checkbox({
      displayName: 'Use Column Names',
      description: 'Key each row by column name instead of A, B, C.',
      required: false,
      defaultValue: false,
      advanced: true,
    }),
    markdown: Property.MarkDown({
      value: notes,
    }),
    memKey: Property.ShortText({
      displayName: 'Memory Key',
      description: 'The key used to store the current row number in memory',
      required: true,
      defaultValue: 'row_number',
    }),
    groupSize: Property.Number({
      displayName: 'Group Size',
      description: 'The number of rows to get',
      required: true,
      defaultValue: 1,
    }),
  },
  outputSchema: getNextRowsActionOutputSchema,
  async run({ store, auth, propsValue }) {
    const { startRow, groupSize, memKey, headerRow, spreadsheetId, sheetId, useHeaderNames} = propsValue;

    if (!areSheetIdsValid(spreadsheetId, sheetId) || isNil(spreadsheetId) || isNil(sheetId)) {
			throw new Error('Please select a spreadsheet and sheet first.');
		}

    await propsValidation.validateZod(propsValue, {
      startRow: z.number().check(z.minimum(1)),
      groupSize: z.number().check(z.minimum(1)),
    });

    return await nextRows.readNextRows({
      store,
      auth,
      spreadsheetId,
      sheetId,
      memKey,
      groupSize,
      startRow,
      headerRow,
      useHeaderNames: useHeaderNames === true,
      testing: false,
    });
  },
  async test({ store, auth, propsValue }) {
    const { startRow, groupSize, memKey, headerRow, spreadsheetId, sheetId, useHeaderNames} = propsValue;

    if (!areSheetIdsValid(spreadsheetId, sheetId) || isNil(spreadsheetId) || isNil(sheetId)) {
			throw new Error('Please select a spreadsheet and sheet first.');
		}

    return await nextRows.readNextRows({
      store,
      auth,
      spreadsheetId,
      sheetId,
      memKey,
      groupSize,
      startRow,
      headerRow,
      useHeaderNames: useHeaderNames === true,
      testing: true,
    });
  },
});
