import { gristAuth } from '../..';
import { createAction } from '@activepieces/pieces-framework';
import { commonProps } from '../common/props';

export const gristCreateRecordAction = createAction({
	auth: gristAuth,
	name: 'grist-create-record',
	displayName: 'Create Record',
	description: 'Creates a new record in specific table.',
	props: {
		workspace_id: commonProps.workspace_id,
		document_id: commonProps.document_id,
		table_id: commonProps.table_id,
		table_columns: commonProps.table_columns,
	},
	async run(context) {
		return context.propsValue;
	},
});
