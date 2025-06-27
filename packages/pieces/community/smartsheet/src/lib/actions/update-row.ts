import { createAction, Property } from '@activepieces/pieces-framework';
import { smartsheetAuth } from '../../index';
import { smartsheetCommon, updateRowInSmartsheet } from '../common';

export const updateRow = createAction({
	auth: smartsheetAuth,
	name: 'update_row',
	displayName: 'Update Row',
	description: 'Updates an existing row.',
	props: {
		sheet_id: smartsheetCommon.sheet_id(),
		row_id: smartsheetCommon.row_id,
		cells: smartsheetCommon.cells,
	},

	async run(context) {
		const { sheet_id, row_id, cells } = context.propsValue;

		const rowObj: any = {
			id: row_id,
		};

		// Transform dynamic cells data into proper Smartsheet format
		const cellsData = cells as Record<string, any>;
		const transformedCells: any[] = [];

		for (const [key, value] of Object.entries(cellsData)) {
			if (value === undefined || value === null || value === '') {
				continue; // Skip empty values
			}

			let columnId: number;
			const cellObj: any = {};

			if (key.startsWith('column_')) {
				// Regular column value
				columnId = parseInt(key.replace('column_', ''));
				cellObj.columnId = columnId;
				cellObj.value = value;
			} else {
				continue; // Skip unknown keys
			}

			transformedCells.push(cellObj);
		}

		// Only add cells array if we have cells to update
		if (transformedCells.length > 0) {
			rowObj.cells = transformedCells;
		}

		try {
			const result = await updateRowInSmartsheet(context.auth as string, sheet_id as string, [
				[rowObj],
			]);

			return {
				success: true,
				row: result,
				message: 'Row updated successfully',
				cells_processed: transformedCells.length,
			};
		} catch (error: any) {
			if (error.response?.status === 400) {
				const errorBody = error.response.data;
				throw new Error(`Bad Request: ${errorBody.message || 'Invalid row data or parameters'}`);
			} else if (error.response?.status === 403) {
				throw new Error('Insufficient permissions to update rows in this sheet');
			} else if (error.response?.status === 404) {
				throw new Error('Sheet not found or you do not have access to it');
			} else if (error.response?.status === 429) {
				throw new Error('Rate limit exceeded. Please try again later.');
			}

			throw new Error(`Failed to update row: ${error.message}`);
		}
	},
});
