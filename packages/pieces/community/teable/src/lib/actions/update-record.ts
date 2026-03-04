import {
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
		fields: Property.Json({
			displayName: 'Fields',
			description:
				'A JSON object of field name/value pairs to update. Example: { "Status": "Done" }',
			required: true,
		}),
	},
	async run(context) {
		const { table_id, recordId, fields } = context.propsValue;
		const client = makeClient(context.auth.props);
		return await client.updateRecord(table_id, recordId, { fields });
	},
});

