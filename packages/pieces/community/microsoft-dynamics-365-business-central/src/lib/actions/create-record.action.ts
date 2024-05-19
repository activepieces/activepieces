import { businessCentralAuth } from '../../';
import { createAction } from '@activepieces/pieces-framework';
import { commonProps } from '../common';
import { makeClient } from '../common/client';

export const createRecordAction = createAction({
	auth: businessCentralAuth,
	name: 'create-record',
	displayName: 'Create Record',
	description: 'Creates a new record.',
	props: {
		company_id: commonProps.company_id,
		record_type: commonProps.record_type,
		record_fields: commonProps.record_fields,
	},
	async run(context) {
		const companyId = context.propsValue.company_id;
		const recordType = context.propsValue.record_type;
		const recordFields = context.propsValue.record_fields;

		const client = makeClient(context.auth);

		return await client.createRecord(companyId, recordType, recordFields);
	},
});
