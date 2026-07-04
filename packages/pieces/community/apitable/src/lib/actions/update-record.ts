import {
	DynamicPropsValue,
	PiecePropValueSchema,
	Property,
	createAction,
} from '@activepieces/pieces-framework';
import { APITableCommon, createNewFields, makeClient } from '../common';
import { APITableAuth } from '../auth';

export const updateRecordAction = createAction({
	auth: APITableAuth,
	name: 'apitable_update_record',
	displayName: 'Update Record',
	description: 'Updates an existing record in datasheet.',
	audience: 'both',
	aiMetadata: {
		description:
			'Updates the field values of an existing record in an AITable datasheet, identified by its record ID. Use when an agent needs to modify a row it can already locate. Idempotent: re-applying the same field values to the same record ID yields the same result with no extra side effect.',
		idempotent: true,
	},
	props: {
		space_id: APITableCommon.space_id,
		datasheet_id: APITableCommon.datasheet_id,
		recordId: Property.ShortText({
			displayName: 'Record ID',
			description: 'The ID of the record to update.',
			required: true,
		}),
		fields: APITableCommon.fields,
	},
	async run(context) {
		const auth = context.auth;
		const datasheetId = context.propsValue.datasheet_id;
		const recordId = context.propsValue.recordId;
		const dynamicFields: DynamicPropsValue = context.propsValue.fields;
		const fields: {
			[n: string]: string;
		} = {};

		const props = Object.entries(dynamicFields);
		for (const [propertyKey, propertyValue] of props) {
			if (propertyValue !== undefined && propertyValue !== '') {
				fields[propertyKey] = propertyValue;
			}
		}
		
		const newFields: Record<string, unknown> = await createNewFields(
			auth.props,
			datasheetId,
			fields,
		);

		const client = makeClient(context.auth.props);

		const response: any = await client.updateRecord(datasheetId, {
			records: [
				{
					recordId: recordId,
					fields: {
						...newFields,
					},
				},
			],
		});

		if (!response.success) {
			throw new Error(JSON.stringify(response, undefined, 2));
		}

		return response;
	},
});
