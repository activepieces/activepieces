import { businessCentralAuth } from '../../';
import { createAction } from '@activepieces/pieces-framework';
import { commonProps } from '../common/props';
import { makeClient } from '../common/client';

export const updateRecordAction = createAction({
	auth: businessCentralAuth,
	name: 'update-record',
	displayName: 'Update Record',
	description: 'Updates an existing record.',
	props: {
		company_id: commonProps.company_id,
		record_type: commonProps.record_type,
		record_id: commonProps.record_id,
		record_fields: commonProps.record_fields,
	},
	async run(context) {
		const companyId = context.propsValue.company_id;
		const recordType = context.propsValue.record_type;
		const recordId = context.propsValue.record_id;
		const recordFields = context.propsValue.record_fields;

		const client = makeClient(context.auth);

		return await client.updateRecord(companyId, recordType, recordId, recordFields);
	},
});
