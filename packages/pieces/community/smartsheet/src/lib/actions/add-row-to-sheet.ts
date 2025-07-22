import { createAction, Property } from '@activepieces/pieces-framework';
import { smartsheetAuth } from '../../index';
import { smartsheetCommon, addRowToSmartsheet } from '../common';

export const addRowToSheet = createAction({
	auth: smartsheetAuth,
	name: 'add_row_to_sheet',
	displayName: 'Add Row to Sheet',
	description:'Adds new row to a sheet.',
	props: {
		sheet_id: smartsheetCommon.sheet_id(),
		cells: smartsheetCommon.cells,
		location_type: Property.StaticDropdown({
			displayName: 'Add Row to Top or Bottom',
			required: true,
			defaultValue: 'bottom',
			options: {
				options: [
					{ label: 'Top of sheet', value: 'top' },
					{ label: 'Bottom of sheet', value: 'bottom' },
				],
			},
		}),
	},

	async run(context) {
		const { sheet_id, cells, location_type } = context.propsValue;

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

		if (transformedCells.length === 0) {
			throw new Error('At least one cell value must be provided');
		}

		// Build the row object with location specifiers
		const rowObj: any = {
			cells: transformedCells,
		};

		// Add location specifiers based on location_type
		switch (location_type) {
			case 'top':
				rowObj.toTop = true;
				break;
			case 'bottom':
				rowObj.toBottom = true;
				break;
		}

		const rowPayload = [rowObj];

		try {
			const result = await addRowToSmartsheet(
				context.auth as string,
				sheet_id as string,
				rowPayload,
			);

			return {
				success: true,
				row: result,
				message: 'Row added successfully',
				cells_processed: transformedCells.length,
			};
		} catch (error: any) {
			if (error.response?.status === 400) {
				const errorBody = error.response.data;
				throw new Error(`Bad Request: ${errorBody.message || 'Invalid row data or parameters'}`);
			} else if (error.response?.status === 403) {
				throw new Error('Insufficient permissions to add rows to this sheet');
			} else if (error.response?.status === 404) {
				throw new Error('Sheet not found or you do not have access to it');
			} else if (error.response?.status === 429) {
				throw new Error('Rate limit exceeded. Please try again later.');
			}

			throw new Error(`Failed to add row: ${error.message}`);
		}
	},
});
