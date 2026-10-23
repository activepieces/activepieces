import { createAction, Property } from '@activepieces/pieces-framework';

import { telnyxAuth } from '../../../auth';
import { telnyxApi } from '../../../common/api';

export const telnyxCancelFaxAction = createAction({
	auth: telnyxAuth,
	name: 'telnyx_cancel_fax',
	displayName: 'Cancel Fax',
	description: 'Cancels an outbound fax that is still queued.',
	audience: 'ai',
	classification: 'DESTRUCTIVE',
	aiMetadata: {
		description:
			'Cancels an outbound fax that is still queued (from Send Fax). Fails once the fax is being sent or finished.',
		idempotent: true,
	},
	props: {
		faxId: Property.ShortText({
			displayName: 'Fax ID',
			description: 'Fax ID, returned by Send Fax or List Faxes.',
			required: true,
		}),
	},
	async run(context) {
		return await telnyxApi.cancelFax({
			auth: context.auth,
			faxId: context.propsValue.faxId,
		});
	},
});
