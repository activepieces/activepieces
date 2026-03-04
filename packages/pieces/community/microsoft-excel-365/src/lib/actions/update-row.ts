import { createAction, Property } from '@activepieces/pieces-framework';
import { excelAuth } from '../auth';
import { commonProps } from '../common/props';
import { getDrivePath, createMSGraphClient } from '../common/helpers';
import { excelCommon, objectToArray } from '../common/common';

export const updateRowAction = createAction({
	auth: excelAuth,
	name: 'update_row',
	description: 'Update a row in a worksheet',
	displayName: 'Update Worksheet Rows',
	props: {
		storageSource: commonProps.storageSource,
		siteId: commonProps.siteId,
		documentId: commonProps.documentId,
		workbookId: commonProps.workbookId,
		worksheetId: commonProps.worksheetId,
		row_number: Property.Number({
			displayName: 'Row number',
			description: 'The row number to update',
			required: true,
		}),
		first_row_headers: Property.Checkbox({
			displayName: 'Does the first row contain headers?',
			description: 'If the first row is headers',
			required: true,
			defaultValue: false,
		}),
		values: commonProps.worksheetValues,
	},
	async run({ propsValue, auth }) {
		const { storageSource, siteId, documentId, workbookId, worksheetId } = propsValue;
		const rowNumber = propsValue['row_number'];
		const values = propsValue.first_row_headers
			? objectToArray(propsValue['values'])
			: Object.values(propsValue['values']);

		if (storageSource === 'sharepoint' && (!siteId || !documentId)) {
			throw new Error('please select SharePoint site and document library.');
		}
		const drivePath = getDrivePath(storageSource, siteId as string, documentId as string);

		const requestBody = {
			values: [values],
		};

		const lastUsedColumn = excelCommon.numberToColumnName(Object.values(values).length);

		const rangeFrom = `A${rowNumber}`;
		const rangeTo = `${lastUsedColumn}${rowNumber}`;

		const client = createMSGraphClient(auth['access_token']);
		const response = await client
			.api(`${drivePath}/items/${workbookId}/workbook/worksheets/${worksheetId}/range(address='${rangeFrom}:${rangeTo}')`)
			.patch(requestBody);

		return response;
	},
});
