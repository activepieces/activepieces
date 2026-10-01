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

const csvResultFields: OutputSchema['fields'] = [
  { key: 'csv', label: 'CSV Text' },
  { key: 'row_count', label: 'Row Count', format: 'number' },
  { key: 'headers', label: 'Column Names' },
  { key: 'rows', label: 'Rows' },
];

export const csvResultOutputSchema: OutputSchema = {
  fields: csvResultFields,
};

export const removeDuplicateCsvRowsOutputSchema: OutputSchema = {
  fields: [
    ...csvResultFields,
    { key: 'removed_count', label: 'Duplicates Removed', format: 'number' },
  ],
};

export const readCsvFileOutputSchema: OutputSchema = {
  fields: [
    { key: 'rows', label: 'Rows' },
    { key: 'row_count', label: 'Row Count', format: 'number' },
    { key: 'headers', label: 'Column Names' },
    { key: 'delimiter', label: 'Delimiter Used' },
  ],
};

export const createCsvFileOutputSchema: OutputSchema = {
  fields: [
    { key: 'file_name', label: 'File Name' },
    { key: 'url', label: 'File URL', format: 'url' },
    { key: 'row_count', label: 'Row Count', format: 'number' },
    { key: 'columns', label: 'Column Names' },
  ],
};

export const convertCsvToExcelOutputSchema: OutputSchema = {
  fields: [
    { key: 'file_name', label: 'File Name' },
    { key: 'url', label: 'File URL', format: 'url' },
    { key: 'row_count', label: 'Rows Written (incl. header)', format: 'number' },
    { key: 'sheet_name', label: 'Sheet Name' },
  ],
};

export const splitCsvOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'chunks',
      label: 'Chunks',
      labelKey: 'index',
      listItems: [
        { key: 'index', label: 'Chunk Number', format: 'number' },
        { key: 'csv', label: 'CSV Text' },
        { key: 'row_count', label: 'Row Count', format: 'number' },
      ],
    },
    { key: 'chunk_count', label: 'Chunk Count', format: 'number' },
    { key: 'total_rows', label: 'Total Rows', format: 'number' },
    { key: 'headers', label: 'Column Names' },
  ],
};
