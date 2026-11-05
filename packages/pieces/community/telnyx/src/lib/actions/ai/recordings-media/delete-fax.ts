import { createAction, Property } from '@activepieces/pieces-framework';

import { telnyxAuth } from '../../../auth';
import { telnyxApi } from '../../../common/api';

export const telnyxDeleteFaxAction = createAction({
	auth: telnyxAuth,
	name: 'telnyx_delete_fax',
	displayName: 'Delete Fax',
	description: 'Deletes a fax record.',
	audience: 'ai',
	classification: 'DESTRUCTIVE',
	aiMetadata: {
		description:
			'Permanently deletes a fax record and its stored media. Cannot be undone. To stop a fax still being sent use Cancel Fax.',
		idempotent: false,
	},
	props: {
		faxId: Property.ShortText({
			displayName: 'Fax ID',
			description: 'Fax ID, returned by Send Fax or List Faxes.',
			required: true,
		}),
	},
	async run(context) {
		const p = context.propsValue;
		await telnyxApi.deleteFax({ auth: context.auth, faxId: p.faxId });
		return { success: true, id: p.faxId };
	},
});
