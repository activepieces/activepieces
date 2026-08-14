import { createAction, Property } from '@activepieces/pieces-framework';
import * as XLSX from 'xlsx';
import { excelToCsvActionOutputSchema } from '../output-schemas';

export const excelToCsvAction = createAction({
  audience: 'both',
  name: 'convert_excel_to_csv',
  displayName: 'Convert Excel to CSV',
  description: 'Converts an Excel file (.xlsx or .xls) into CSV text.',
  aiMetadata: { description: 'Reads a binary Excel workbook (.xlsx or .xls) and converts a single sheet to delimited CSV text (comma, tab, or semicolon), selecting either a named sheet or the first sheet when no name is given. Pick this when the source is a spreadsheet file; use Convert CSV to JSON when you already have CSV text. Requires a real Excel file whose signature is validated, so HTML or PDF content is rejected, and any sheet name given must exist in the workbook; read-only and idempotent.', idempotent: true },
  errorHandlingOptions: {
    continueOnFailure: { hide: true },
    retryOnFailure: { hide: true },
  },
  props: {
    file: Property.File({
      displayName: 'Excel File',
      description: 'The Excel file (.xlsx or .xls) to convert to CSV.',
      required: true,
    }),
    sheet_name: Property.ShortText({
      displayName: 'Sheet Name',
      description: 'Name of the sheet to convert. Leave blank to use the first sheet.',
      required: false,
    }),
    delimiter_type: Property.StaticDropdown({
      displayName: 'Delimiter',
      description: 'Character used to separate values in the output CSV.',
      defaultValue: ',',
      required: true,
      options: {
        options: [
          { label: 'Comma (,)', value: ',' },
          { label: 'Tab', value: '\t' },
          { label: 'Semicolon (;)', value: ';' },
        ],
      },
    }),
  },
  outputSchema: excelToCsvActionOutputSchema,
  async run(context) {
    const { file, sheet_name, delimiter_type } = context.propsValue;

    const buffer = Buffer.from(file.base64, 'base64');

    // XLSX (ZIP) starts with PK\x03\x04; XLS (OLE2) starts with \xD0\xCF\x11\xE0.
    // Anything else (HTML, PDF, …) is rejected with a clear message.
    const isXlsx = buffer[0] === 0x50 && buffer[1] === 0x4b;
    const isXls = buffer[0] === 0xd0 && buffer[1] === 0xcf;
    if (!isXlsx && !isXls) {
      throw new Error(
        'The file does not appear to be a valid Excel file (.xlsx or .xls). ' +
        'If you supplied a URL, make sure it points directly to the file download, not a webpage.'
      );
    }

    const workbook = XLSX.read(buffer, { type: 'buffer' });

    const targetSheet = sheet_name?.trim() || workbook.SheetNames[0];

    if (!workbook.SheetNames.includes(targetSheet)) {
      throw new Error(
        `Sheet "${targetSheet}" not found. Available sheets: ${workbook.SheetNames.join(', ')}`
      );
    }

    const worksheet = workbook.Sheets[targetSheet];
    const csv = XLSX.utils.sheet_to_csv(worksheet, { FS: delimiter_type });

    return {
      csv,
      sheet_name: targetSheet,
      available_sheets: workbook.SheetNames,
    };
  },
});
