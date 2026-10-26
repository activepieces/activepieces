import { createAction, Property } from '@activepieces/pieces-framework';

import { telnyxAuth } from '../../../auth';
import { telnyxApi } from '../../../common/api';

export const telnyxRefreshFaxAction = createAction({
	auth: telnyxAuth,
	name: 'telnyx_refresh_fax',
	displayName: 'Refresh Fax',
	description: 'Refreshes the expired media links of a fax.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Generates fresh media and preview URLs for a fax whose links have expired. Call Get Fax afterwards to read the new URLs.',
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
		return await telnyxApi.refreshFax({
			auth: context.auth,
			faxId: context.propsValue.faxId,
		});
	},
});
