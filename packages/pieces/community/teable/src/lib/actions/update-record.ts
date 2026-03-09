import {
	DynamicPropsValue,
	Property,
	createAction,
} from '@activepieces/pieces-framework';
import { TeableCommon, makeClient } from '../common';
import { TeableAuth } from '../auth';

export const updateRecordAction = createAction({
	auth: TeableAuth,
	name: 'teable_update_record',
	displayName: 'Update Record',
	description: 'Updates an existing record in a Teable table.',
	props: {
		base_id: TeableCommon.base_id,
		table_id: TeableCommon.table_id,
		recordId: Property.ShortText({
			displayName: 'Record ID',
			description: 'The ID of the record to update (e.g. recXXXXXXX).',
			required: true,
		}),
		fields: TeableCommon.fields,
	},
	async run(context) {
		const { table_id, recordId } = context.propsValue;
		const dynamicFields: DynamicPropsValue = context.propsValue.fields;

		const fields: Record<string, unknown> = {};
			if (value !== undefined && value !== null && value !== '') {
			}
		}

		const client = makeClient(context.auth.props);
		return await client.updateRecord(table_id, recordId, { record: { fields } });
	},
});

