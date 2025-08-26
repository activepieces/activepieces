import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { SoftrAuth } from '../common/auth';
import { makeRequest, transformRecordFields } from '../common/client';
import { databaseIdDropdown, tableFieldIdDropdown, tableIdDropdown } from '../common/props';
import { TableField } from '../common/types';

export const findDatabaseRecord = createAction({
	auth: SoftrAuth,
	name: 'findDatabaseRecord',
	displayName: 'Find Database Record',
	description: 'Finds a record in table.',
	props: {
		databaseId: databaseIdDropdown,
		tableId: tableIdDropdown,
		fieldId: tableFieldIdDropdown,
		fieldValue: Property.ShortText({
			displayName: 'Field Value',
			required: true,
		}),
	},
	async run({ auth, propsValue }) {
		const { databaseId, tableId, fieldId, fieldValue } = propsValue;

		const requestBody = {
			paging: {
				limit: 1,
			},
			filter: {
				condition: {
					operator: 'AND',
					conditions: [
						{
							leftSide: fieldId,
							operator: 'IS',
							rightSide: fieldValue,
						},
					],
				},
			},
		};

		const response = await makeRequest<{
			data: {
				fields: TableField[];
			}[];
		}>(
			auth,
			HttpMethod.POST,
			`/databases/${databaseId}/tables/${tableId}/records/search`,
			requestBody,
		);

		if (Array.isArray(response.data) && response.data.length === 0) {
			return {
				found: false,
				data: {},
			};
		}

		const foundRecord = response.data[0];

		const tableReponse = await makeRequest<{
			data: {
				fields: TableField[];
			};
		}>(auth, HttpMethod.GET, `/databases/${databaseId}/tables/${tableId}`);

		const transformedFields = transformRecordFields(tableReponse.data.fields, foundRecord.fields);

		return {
			found: true,
			data: {
				...foundRecord,
				fields: transformedFields,
			},
		};
	},
});
