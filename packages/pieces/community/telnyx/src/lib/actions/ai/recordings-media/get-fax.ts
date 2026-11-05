import { createAction, Property } from '@activepieces/pieces-framework';

import { telnyxAuth } from '../../../auth';
import { telnyxApi } from '../../../common/api';

export const telnyxGetFaxAction = createAction({
	auth: telnyxAuth,
	name: 'telnyx_get_fax',
	displayName: 'Get Fax',
	description: 'Gets a fax and its status.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			'Gets one fax by id, including its status (queued, sending, delivered, failed), failure reason and media.',
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
		return await telnyxApi.getFax({
			auth: context.auth,
			faxId: context.propsValue.faxId,
		});
	},
});
