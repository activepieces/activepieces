import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod, AuthenticationType } from '@activepieces/pieces-common';
import { excelAuth } from '../../index';
import { excelCommon, objectToArray } from '../common/common';

export const updateRowAction = createAction({
	auth: excelAuth,
	name: 'update_row',
	description: 'Update a row in a worksheet',
	displayName: 'Update Worksheet Rows',
	props: {
		workbook_id: excelCommon.workbook_id,
		worksheet_id: excelCommon.worksheet_id,
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
		values: excelCommon.values,
	},
	async run({ propsValue, auth }) {
		const workbookId = propsValue['workbook_id'];
		const worksheetId = propsValue['worksheet_id'];
		const rowNumber = propsValue['row_number'];
		const values = propsValue.first_row_headers
			? objectToArray(propsValue['values'])
			: Object.values(propsValue['values']);

		const requestBody = {
			values: [values],
		};

		const lastUsedColumn = excelCommon.numberToColumnName(Object.values(values).length);

		const rangeFrom = `A${rowNumber}`;
		const rangeTo = `${lastUsedColumn}${rowNumber}`;

		const request = {
			method: HttpMethod.PATCH,
			url: `${excelCommon.baseUrl}/items/${workbookId}/workbook/worksheets/${worksheetId}/range(address='${rangeFrom}:${rangeTo}')`,
			body: requestBody,
			authentication: {
				type: AuthenticationType.BEARER_TOKEN as const,
				token: auth['access_token'],
			},
		};

		const response = await httpClient.sendRequest(request);

		return response.body;
	},
});
