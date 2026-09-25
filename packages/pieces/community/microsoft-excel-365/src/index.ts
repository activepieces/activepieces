import { createCustomApiCallAction } from '@activepieces/pieces-common';
import {
  createPiece,
  OAuth2PropertyValue,
} from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/pieces-framework';

import { addWorksheetAction } from './lib/actions/add-worksheet';
import { appendRowAction } from './lib/actions/append-row';
import { appendTableRowsAction } from './lib/actions/append-table-rows';
import { clearWorksheetAction } from './lib/actions/clear-worksheet';
import { convertToRangeAction } from './lib/actions/convert-to-range';
import { createTableAction } from './lib/actions/create-table';
import { createWorkbook } from './lib/actions/create-workbook';
import { deleteTableAction } from './lib/actions/delete-table';
import { deleteWorkbookAction } from './lib/actions/delete-workbook';
import { deleteWorksheetAction } from './lib/actions/delete-worksheet';
import { getTableColumnsAction } from './lib/actions/get-table-columns';
import { getTableRowsAction } from './lib/actions/get-table-rows';
import { getWorkbooksAction } from './lib/actions/get-workbooks';
import { getWorksheetRowsAction } from './lib/actions/get-worksheet-rows';
import { getWorksheetsAction } from './lib/actions/get-worksheets';
import { lookupTableColumnAction } from './lib/actions/lookup-table-column';
import { updateRowAction } from './lib/actions/update-row';

import { clearRangeAction } from './lib/actions/clear-cells-by-range';
import { clearColumnAction } from './lib/actions/clear-column-by-index';
import { clearRowAction } from './lib/actions/clear-row-by-id';
import { deleteRowAction } from './lib/actions/delete-row';
import { createWorksheetAction } from './lib/actions/create-worksheet';
import { copyWorksheetAction } from './lib/actions/copy-worksheet';
import { findRowAction } from './lib/actions/find-row';
import { getRangeAction } from './lib/actions/get-cells-in-range';
import { getRowAction } from './lib/actions/get-row-by-id';
import { getWorksheetAction } from './lib/actions/get-worksheet-by-id';
import { renameWorksheetAction } from './lib/actions/rename-worksheet';

import { readNewRows } from './lib/trigger/new-row-added';

import { newRowInTableTrigger } from './lib/trigger/new-row-in-table';
import { newWorksheetTrigger } from './lib/trigger/new-worksheet';
import { updatedRowTrigger } from './lib/trigger/updated-row';

import { appendMultipleRowsAction } from './lib/actions/append-multiple-rows';
import { findWorkbookAction } from './lib/actions/find-workbooks';
import { findWorksheetAction } from './lib/actions/find-worksheets';
import { getWorksheetColumnsAction } from './lib/actions/get-wroksheet-columns';
import { excelAddChart } from './lib/actions/excel-add-chart';
import { excelAddTableColumn } from './lib/actions/excel-add-table-column';
import { excelAddTableRows } from './lib/actions/excel-add-table-rows';
import { excelAddWorksheet } from './lib/actions/excel-add-worksheet';
import { excelAppendRows } from './lib/actions/excel-append-rows';
import { excelApplyTableFilter } from './lib/actions/excel-apply-table-filter';
import { excelClearRange } from './lib/actions/excel-clear-range';
import { excelClearTableFilter } from './lib/actions/excel-clear-table-filter';
import { excelConvertTableToRange } from './lib/actions/excel-convert-table-to-range';
import { excelCreateTable } from './lib/actions/excel-create-table';
import { excelCreateWorkbook } from './lib/actions/excel-create-workbook';
import { excelDeleteRange } from './lib/actions/excel-delete-range';
import { excelDeleteTableColumn } from './lib/actions/excel-delete-table-column';
import { excelDeleteTableRow } from './lib/actions/excel-delete-table-row';
import { excelDeleteWorksheet } from './lib/actions/excel-delete-worksheet';
import { excelExportWorkbookPdf } from './lib/actions/excel-export-workbook-pdf';
import { excelFindTableRows } from './lib/actions/excel-find-table-rows';
import { excelGetChartAxis } from './lib/actions/excel-get-chart-axis';
import { excelGetChartDataLabels } from './lib/actions/excel-get-chart-data-labels';
import { excelGetChartLegend } from './lib/actions/excel-get-chart-legend';
import { excelGetCurrentUser } from './lib/actions/excel-get-current-user';
import { excelGetRange } from './lib/actions/excel-get-range';
import { excelGetTableColumn } from './lib/actions/excel-get-table-column';
import { excelGetUsedRange } from './lib/actions/excel-get-used-range';
import { excelGetWorkbook } from './lib/actions/excel-get-workbook';
import { excelGetWorksheet } from './lib/actions/excel-get-worksheet';
import { excelInsertRange } from './lib/actions/excel-insert-range';
import { excelListChartSeries } from './lib/actions/excel-list-chart-series';
import { excelListCharts } from './lib/actions/excel-list-charts';
import { excelListComments } from './lib/actions/excel-list-comments';
import { excelListNamedItems } from './lib/actions/excel-list-named-items';
import { excelListTableColumns } from './lib/actions/excel-list-table-columns';
import { excelListTableRows } from './lib/actions/excel-list-table-rows';
import { excelListTables } from './lib/actions/excel-list-tables';
import { excelListWorkbookPermissions } from './lib/actions/excel-list-workbook-permissions';
import { excelListWorkbooks } from './lib/actions/excel-list-workbooks';
import { excelListWorksheets } from './lib/actions/excel-list-worksheets';
import { excelMergeCells } from './lib/actions/excel-merge-cells';
import { excelProtectWorksheet } from './lib/actions/excel-protect-worksheet';
import { excelSearchWorkbooks } from './lib/actions/excel-search-workbooks';
import { excelShareWorkbook } from './lib/actions/excel-share-workbook';
import { excelSortRange } from './lib/actions/excel-sort-range';
import { excelSortTable } from './lib/actions/excel-sort-table';
import { excelUnprotectWorksheet } from './lib/actions/excel-unprotect-worksheet';
import { excelUpdateChartLegend } from './lib/actions/excel-update-chart-legend';
import { excelUpdateChart } from './lib/actions/excel-update-chart';
import { excelUpdateRange } from './lib/actions/excel-update-range';
import { excelUpdateTable } from './lib/actions/excel-update-table';
import { excelUpdateWorksheet } from './lib/actions/excel-update-worksheet';
import { excelUploadWorkbook } from './lib/actions/excel-upload-workbook';
import { excelCommon } from './lib/common/common';
import { excelAuth } from './lib/auth';

export const microsoftExcel = createPiece({
	displayName: 'Microsoft Excel 365',
	description: 'Spreadsheet software by Microsoft',

	auth: excelAuth,
	minimumSupportedRelease: '0.88.2',
	logoUrl: 'https://cdn.activepieces.com/pieces/microsoft-excel-365.png',
	categories: [PieceCategory.PRODUCTIVITY],
	authors: [
		'BastienMe',
		'kishanprmr',
		'MoShizzle',
		'abuaboud',
		'Pranith124',
		'onyedikachi-david',
	],
	actions: [
		appendRowAction,
		appendMultipleRowsAction,
		getWorksheetsAction,
		getWorksheetRowsAction,
		updateRowAction,
		clearWorksheetAction,
		deleteWorksheetAction,
		getWorkbooksAction,
		getWorksheetColumnsAction,
		deleteWorkbookAction,
		addWorksheetAction,
		getTableRowsAction,
		getTableColumnsAction,
		createTableAction,
		deleteTableAction,
		lookupTableColumnAction,
		appendTableRowsAction,
		convertToRangeAction,
		createWorkbook,
		clearColumnAction,
		clearRangeAction,
		clearRowAction,
		deleteRowAction,
		createWorksheetAction,
		copyWorksheetAction,
		findRowAction,
		findWorkbookAction,
		findWorksheetAction,
		getRangeAction,
		getRowAction,
		getWorksheetAction,
		renameWorksheetAction,
		excelAddChart,
		excelAddTableColumn,
		excelAddTableRows,
		excelAddWorksheet,
		excelAppendRows,
		excelApplyTableFilter,
		excelClearRange,
		excelClearTableFilter,
		excelConvertTableToRange,
		excelCreateTable,
		excelCreateWorkbook,
		excelDeleteRange,
		excelDeleteTableColumn,
		excelDeleteTableRow,
		excelDeleteWorksheet,
		excelExportWorkbookPdf,
		excelFindTableRows,
		excelGetChartAxis,
		excelGetChartDataLabels,
		excelGetChartLegend,
		excelGetCurrentUser,
		excelGetRange,
		excelGetTableColumn,
		excelGetUsedRange,
		excelGetWorkbook,
		excelGetWorksheet,
		excelInsertRange,
		excelListChartSeries,
		excelListCharts,
		excelListComments,
		excelListNamedItems,
		excelListTableColumns,
		excelListTableRows,
		excelListTables,
		excelListWorkbookPermissions,
		excelListWorkbooks,
		excelListWorksheets,
		excelMergeCells,
		excelProtectWorksheet,
		excelSearchWorkbooks,
		excelShareWorkbook,
		excelSortRange,
		excelSortTable,
		excelUnprotectWorksheet,
		excelUpdateChartLegend,
		excelUpdateChart,
		excelUpdateRange,
		excelUpdateTable,
		excelUpdateWorksheet,
		excelUploadWorkbook,
		createCustomApiCallAction({
			baseUrl: (auth) => {
				const cloud = (auth as OAuth2PropertyValue).props?.['cloud'] as string | undefined;
				return excelCommon.getBaseUrl(cloud);
			},
			auth: excelAuth,
			authMapping: async (auth) => ({
				Authorization: `Bearer ${(auth as OAuth2PropertyValue).access_token}`,
			}),
		}),
	],
	triggers: [readNewRows, newRowInTableTrigger, newWorksheetTrigger, updatedRowTrigger],
});
