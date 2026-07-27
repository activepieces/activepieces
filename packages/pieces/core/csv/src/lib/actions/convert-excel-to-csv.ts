import { createAction, Property } from '@activepieces/pieces-framework';
import * as XLSX from 'xlsx';

export const excelToCsvAction = createAction({
  audience: 'human',
  name: 'convert_excel_to_csv',
  displayName: 'Convert Excel to CSV',
  description: 'Converts an Excel file (.xlsx or .xls) into CSV text.',
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
