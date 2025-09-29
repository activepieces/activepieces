import {
	DynamicPropsValue,
	PiecePropValueSchema,
	Property,
	createAction,
} from '@activepieces/pieces-framework';
import { BikaCommon, createNewFields, makeClient } from '../common';
import { BikaAuth } from '../../index';

export const updateRecordAction = createAction({
	auth: BikaAuth,
	name: 'bika_update_record',
	displayName: 'Update Record',
	description: 'Updates an existing record in database.',
	props: {
		space_id: BikaCommon.space_id,
		database_id: BikaCommon.database_id,
		recordId: Property.ShortText({
			displayName: 'Record ID',
			description: 'The ID of the record to update.',
			required: true,
		}),
		fields: BikaCommon.fields,
	},
	async run(context) {
		const auth = context.auth;
		const databaseId = context.propsValue.database_id;
		const spaceId = context.propsValue.space_id;
		const recordId = context.propsValue.recordId;
		const dynamicFields: DynamicPropsValue = context.propsValue.fields;
		const fields: {
			[n: string]: any;
		} = {};

		const props = Object.entries(dynamicFields);
		for (const [propertyKey, propertyValue] of props) {
			if (propertyValue !== undefined && propertyValue !== '') {
				fields[propertyKey] = propertyValue;
			}
		}

		const newFields: Record<string, unknown> = await createNewFields(
			auth as PiecePropValueSchema<typeof BikaAuth>,
			spaceId,
			databaseId,
			fields,
		);

		const client = makeClient(context.auth as PiecePropValueSchema<typeof BikaAuth>);

		const response: any = await client.updateRecord(spaceId, databaseId, recordId, {
					fields: {
						...newFields,
					},
		});

		if (!response.success) {
			throw new Error(JSON.stringify(response, undefined, 2));
		}

		return response;
	},
});
