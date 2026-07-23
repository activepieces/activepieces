import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/pieces-framework';
import { clearSheetAction } from './lib/actions/clear-sheet';
import { deleteRowAction } from './lib/actions/delete-row.action';
import { findRowByNumAction } from './lib/actions/find-row-by-num';
import { findRowsAction } from './lib/actions/find-rows';
import { getRowsAction } from './lib/actions/get-rows';
import { insertRowAction } from './lib/actions/insert-row.action';
import { updateRowAction } from './lib/actions/update-row';
import {
	getAccessToken,
	googleSheetsAuth,
	GoogleSheetsAuthValue,
	googleSheetsCommon,
} from './lib/common/common';
import { newRowAddedTrigger } from './lib/triggers/new-row-added-webhook';
import { newOrUpdatedRowTrigger } from './lib/triggers/new-or-updated-row.trigger';
import { insertMultipleRowsAction } from './lib/actions/insert-multiple-rows.action';
import { createWorksheetAction } from './lib/actions/create-worksheet';
import { createSpreadsheetAction } from './lib/actions/create-spreadsheet';
import { findSpreadsheets } from './lib/actions/find-spreadsheets';
import { newSpreadsheetTrigger } from './lib/triggers/new-spreadsheet';
import { newWorksheetTrigger } from './lib/triggers/new-worksheet';
import { findWorksheetAction } from './lib/actions/find-worksheet';
import { copyWorksheetAction } from './lib/actions/copy-worksheet';
import { updateMultipleRowsAction } from './lib/actions/update-multiple-rows';
import { createColumnAction } from './lib/actions/create-column';
import { exportSheetAction } from './lib/actions/export-sheet';
import { getManyRowsAction } from './lib/actions/get-many-rows';
import { renameWorksheetAction } from './lib/actions/rename-worksheet';
import { deleteWorksheetAction } from './lib/actions/delete-worksheet';
import { formatRowAction } from './lib/actions/format-spreadsheet-row';
import { findOrCreateRowAction } from './lib/actions/find-or-create-row';
import { findOrCreateWorksheetAction } from './lib/actions/find-or-create-worksheet';
import { insertRowAtTopAction } from './lib/actions/insert-row-at-top';
import { clearRowsAction } from './lib/actions/clear-rows';
import { readDataRangeAction } from './lib/actions/read-data-range';
import { deleteMultipleRowsAction } from './lib/actions/delete-multiple-rows';
import { sheetsAddColumn } from './lib/actions/sheets-add-column';
import { sheetsAddMultipleRows } from './lib/actions/sheets-add-multiple-rows';
import { sheetsAddRowAtTop } from './lib/actions/sheets-add-row-at-top';
import { sheetsAddRow } from './lib/actions/sheets-add-row';
import { sheetsAddWorksheet } from './lib/actions/sheets-add-worksheet';
import { sheetsAppendDimension } from './lib/actions/sheets-append-dimension';
import { sheetsAppendValues } from './lib/actions/sheets-append-values';
import { sheetsAutoResizeDimensions } from './lib/actions/sheets-auto-resize-dimensions';
import { sheetsClearValues } from './lib/actions/sheets-clear-values';
import { sheetsCopyWorksheet } from './lib/actions/sheets-copy-worksheet';
import { sheetsCreateSpreadsheet } from './lib/actions/sheets-create-spreadsheet';
import { sheetsDeleteDimension } from './lib/actions/sheets-delete-dimension';
import { sheetsDeleteMultipleRows } from './lib/actions/sheets-delete-multiple-rows';
import { sheetsDeleteRow } from './lib/actions/sheets-delete-row';
import { sheetsDeleteWorksheet } from './lib/actions/sheets-delete-worksheet';
import { sheetsExportWorksheet } from './lib/actions/sheets-export-worksheet';
import { sheetsFindOrCreateRow } from './lib/actions/sheets-find-or-create-row';
import { sheetsFindOrCreateWorksheet } from './lib/actions/sheets-find-or-create-worksheet';
import { sheetsFindRows } from './lib/actions/sheets-find-rows';
import { sheetsFindWorksheet } from './lib/actions/sheets-find-worksheet';
import { sheetsFormatCells } from './lib/actions/sheets-format-cells';
import { sheetsGetAllRows } from './lib/actions/sheets-get-all-rows';
import { sheetsGetNextRows } from './lib/actions/sheets-get-next-rows';
import { sheetsGetRow } from './lib/actions/sheets-get-row';
import { sheetsGetSpreadsheet } from './lib/actions/sheets-get-spreadsheet';
import { sheetsGetValues } from './lib/actions/sheets-get-values';
import { sheetsInsertDimension } from './lib/actions/sheets-insert-dimension';
import { sheetsRenameWorksheet } from './lib/actions/sheets-rename-worksheet';
import { sheetsSearchSpreadsheets } from './lib/actions/sheets-search-spreadsheets';
import { sheetsUpdateDimensionProperties } from './lib/actions/sheets-update-dimension-properties';
import { sheetsUpdateMultipleRows } from './lib/actions/sheets-update-multiple-rows';
import { sheetsUpdateRow } from './lib/actions/sheets-update-row';
import { sheetsUpdateSheetProperties } from './lib/actions/sheets-update-sheet-properties';
import { sheetsUpdateValues } from './lib/actions/sheets-update-values';

export const googleSheets = createPiece({
	minimumSupportedRelease: '0.71.4',
	logoUrl: 'https://cdn.activepieces.com/pieces/google-sheets.png',
	categories: [PieceCategory.PRODUCTIVITY],
	authors: [
		'ShayPunter',
		'Ozak93',
		'Abdallah-Alwarawreh',
		'Salem-Alaa',
		'kishanprmr',
		'MoShizzle',
		'AbdulTheActivePiecer',
		'khaledmashaly',
		'abuaboud',
		'geekyme',
	],
	actions: [
		insertRowAction,
		insertRowAtTopAction,
		insertMultipleRowsAction,
		updateRowAction,
		updateMultipleRowsAction,
		deleteRowAction,
		deleteMultipleRowsAction,
		findRowsAction,
		findOrCreateRowAction,
		createSpreadsheetAction,
		createWorksheetAction,
		findOrCreateWorksheetAction,
		clearSheetAction,
		clearRowsAction,
		deleteWorksheetAction,
		renameWorksheetAction,
		formatRowAction,
		findRowByNumAction,
		getRowsAction,
		getManyRowsAction,
		readDataRangeAction,
		findSpreadsheets,
		findWorksheetAction,
		copyWorksheetAction,
		createColumnAction,
		exportSheetAction,
		sheetsAddColumn,
		sheetsAddMultipleRows,
		sheetsAddRowAtTop,
		sheetsAddRow,
		sheetsAddWorksheet,
		sheetsAppendDimension,
		sheetsAppendValues,
		sheetsAutoResizeDimensions,
		sheetsClearValues,
		sheetsCopyWorksheet,
		sheetsCreateSpreadsheet,
		sheetsDeleteDimension,
		sheetsDeleteMultipleRows,
		sheetsDeleteRow,
		sheetsDeleteWorksheet,
		sheetsExportWorksheet,
		sheetsFindOrCreateRow,
		sheetsFindOrCreateWorksheet,
		sheetsFindRows,
		sheetsFindWorksheet,
		sheetsFormatCells,
		sheetsGetAllRows,
		sheetsGetNextRows,
		sheetsGetRow,
		sheetsGetSpreadsheet,
		sheetsGetValues,
		sheetsInsertDimension,
		sheetsRenameWorksheet,
		sheetsSearchSpreadsheets,
		sheetsUpdateDimensionProperties,
		sheetsUpdateMultipleRows,
		sheetsUpdateRow,
		sheetsUpdateSheetProperties,
		sheetsUpdateValues,
		createCustomApiCallAction({
			auth: googleSheetsAuth,
			baseUrl: () => {
				return googleSheetsCommon.baseUrl;
			},
			authMapping: async (auth) => {
				return {
					Authorization: `Bearer ${await getAccessToken(auth as GoogleSheetsAuthValue)}`,
				};
			},
		}),
	],
	displayName: 'Google Sheets',
	description: 'Create, edit, and collaborate on spreadsheets online',
	triggers: [
		newOrUpdatedRowTrigger,
		newRowAddedTrigger,
		newSpreadsheetTrigger,
		newWorksheetTrigger,
	],
	auth: googleSheetsAuth,
});
