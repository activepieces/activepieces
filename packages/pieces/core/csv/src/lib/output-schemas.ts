import { OutputSchema } from '@activepieces/pieces-framework';

// run() returns the CSV text itself, not an object -- value: '' labels the
// whole string so it isn't rendered as an unlabeled blob.
export const jsonToCsvActionOutputSchema: OutputSchema = {
  fields: [{ key: 'csv', label: 'CSV Text', value: '' }],
};

export const excelToCsvActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'csv', label: 'CSV Text' },
    { key: 'sheet_name', label: 'Sheet Name' },
    // Items are plain sheet-name strings, not objects, so left undescribed --
    // the renderer already drills a bare array generically.
    { key: 'available_sheets', label: 'Available Sheets' },
  ],
};
