import { PieceAuth, createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/pieces-framework';
import { csvToJsonAction } from './lib/actions/convert-csv-to-json';
import { jsonToCsvAction } from './lib/actions/convert-json-to-csv';
import { excelToCsvAction } from './lib/actions/convert-excel-to-csv';
import { readCsvFileAction } from './lib/actions/read-csv-file';
import { createCsvFileAction } from './lib/actions/create-csv-file';
import { convertCsvToExcelAction } from './lib/actions/convert-csv-to-excel';
import { filterCsvRowsAction } from './lib/actions/filter-csv-rows';
import { sortCsvRowsAction } from './lib/actions/sort-csv-rows';
import { removeDuplicateCsvRowsAction } from './lib/actions/remove-duplicate-csv-rows';
import { selectCsvColumnsAction } from './lib/actions/select-csv-columns';
import { mergeCsvAction } from './lib/actions/merge-csv';
import { splitCsvAction } from './lib/actions/split-csv';

export const csv = createPiece({
  displayName: 'CSV',
  description: 'Manipulate CSV text',
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/new-core/csv.svg',
  auth: PieceAuth.None(),
  categories: [PieceCategory.CORE],
  actions: [
    csvToJsonAction,
    jsonToCsvAction,
    excelToCsvAction,
    readCsvFileAction,
    createCsvFileAction,
    convertCsvToExcelAction,
    filterCsvRowsAction,
    sortCsvRowsAction,
    removeDuplicateCsvRowsAction,
    selectCsvColumnsAction,
    mergeCsvAction,
    splitCsvAction,
  ],
  authors: ["kishanprmr", "MoShizzle", "khaledmashaly", "abuaboud", 'sanket-a11y'],
  triggers: [],
});
