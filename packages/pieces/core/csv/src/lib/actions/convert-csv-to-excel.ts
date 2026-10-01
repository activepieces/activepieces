import { createAction, Property } from '@activepieces/pieces-framework';
import * as XLSX from 'xlsx';
import { csvProps } from '../common/csv-props';
import { csvUtils } from '../common/csv-utils';
import { convertCsvToExcelOutputSchema } from '../output-schemas';

export const convertCsvToExcelAction = createAction({
  audience: 'both',
  name: 'convert_csv_to_excel',
  classification: 'READ',
  displayName: 'Convert CSV to Excel',
  description: 'Turns CSV text into an Excel (.xlsx) file.',
  aiMetadata: {
    description:
      'Converts CSV text into a one-sheet .xlsx workbook file, keeping values such as zip codes with leading zeros and long ids as text and optionally storing numbers as number cells only when they fit in 15 significant digits, so the value never changes. The header row, when present, always stays text. Pick this when the recipient needs a spreadsheet file; use Convert Excel to CSV for the reverse and Create CSV File when a .csv file is enough. Up to 20 MB and 100,000 rows; the same input gives the same workbook content, so it is idempotent.',
    idempotent: true,
  },
  props: {
    csv_text: Property.LongText({
      displayName: 'CSV Text',
      description: 'Paste CSV text or map it from an earlier step.',
      placeholder: 'name,email,city',
      required: true,
    }),
    delimiter: csvProps.inputDelimiter(),
    has_header_row: Property.Checkbox({
      displayName: 'Has Header Row',
      description: 'The first row holds column names and always stays text.',
      required: false,
      defaultValue: true,
    }),
    sheet_name: Property.ShortText({
      displayName: 'Sheet Name',
      description: 'Up to 31 characters, without : \\ / ? * [ or ].',
      placeholder: 'Sheet1',
      required: false,
      defaultValue: 'Sheet1',
    }),
    file_name: Property.ShortText({
      displayName: 'File Name',
      description: '".xlsx" is added if you leave out the extension.',
      placeholder: 'data.xlsx',
      required: false,
      defaultValue: 'data.xlsx',
    }),
    detect_numbers: Property.Checkbox({
      displayName: 'Store Numbers as Numbers',
      description:
        'Exact numbers become number cells; values like 01234 stay text.',
      required: false,
      defaultValue: true,
    }),
  },
  outputSchema: convertCsvToExcelOutputSchema,
  async run(context) {
    const { csv_text, delimiter, has_header_row, sheet_name, file_name, detect_numbers } =
      context.propsValue;
    const text = csvUtils.assertCsvText({ value: csv_text });

    const sheetName = (sheet_name ?? '').trim() || 'Sheet1';
    if (sheetName.length > 31 || INVALID_SHEET_CHARS.test(sheetName)) {
      throw new Error(
        `"${sheetName}" is not a valid sheet name. Use up to 31 characters, without : \\ / ? * [ or ].`,
      );
    }

    const hasHeader = has_header_row !== false;
    const records = csvUtils.parseCsvRecords({
      text,
      delimiter: csvUtils.resolveDelimiter({ text, delimiter }),
      hasHeader,
    });
    const toNumbers = detect_numbers !== false;
    const cells = records.map((record, index) =>
      record.map((value) =>
        toNumbers && !(hasHeader && index === 0) && csvUtils.isExactNumber(value) ? Number(value) : value,
      ),
    );

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(cells), sheetName);
    const data: Buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });

    const name = csvUtils.safeFileName({ requested: file_name, fallback: 'data.xlsx', extension: 'xlsx' });
    const url = await context.files.write({ fileName: name, data });
    return {
      file_name: name,
      url,
      row_count: records.length,
      sheet_name: sheetName,
    };
  },
});

const INVALID_SHEET_CHARS = /[:\\/?*[\]]/;
