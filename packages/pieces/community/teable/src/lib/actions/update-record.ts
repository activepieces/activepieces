import {
	DynamicPropsValue,
	createAction,
} from '@activepieces/pieces-framework';
import { TeableCommon, makeClient } from '../common';
import { TeableAuth, TeableAuthValue } from '../auth';

export const updateRecordAction = createAction({
	auth: TeableAuth,
	name: 'teable_update_record',
	displayName: 'Update Record',
	description: 'Updates an existing record in a Teable table.',
	props: {
		base_id: TeableCommon.base_id,
		table_id: TeableCommon.table_id,
		record_id: TeableCommon.record_id,
		fields: TeableCommon.fields,
	},
	async run(context) {
		const { table_id, record_id } = context.propsValue;
		const dynamicFields: DynamicPropsValue = context.propsValue.fields;

		const fields: Record<string, unknown> = {};
		for (const [key, value] of Object.entries(dynamicFields)) {
			if (value !== undefined && value !== null && value !== '') {
				fields[key] = value;
			}
		}

		const client = makeClient(context.auth as TeableAuthValue);
		return await client.updateRecord(table_id, record_id, { record: { fields } });
	},
});
