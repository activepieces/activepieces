import { createAction, Property } from '@activepieces/pieces-framework';

import { telnyxAuth } from '../../../auth';
import { telnyxApi } from '../../../common/api';
import { telnyxUtils } from '../../../common/utils';

export const telnyxLookupPhoneNumberAction = createAction({
	auth: telnyxAuth,
	name: 'telnyx_lookup_phone_number',
	displayName: 'Lookup Phone Number',
	description: 'Looks up carrier and caller name data for any phone number.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			'Looks up any phone number (not only Telnyx ones): validity, national format, carrier and line type, portability and optionally the caller name. Each lookup is billed.',
		idempotent: true,
	},
	props: {
		phoneNumber: Property.ShortText({
			displayName: 'Phone Number',
			description: 'Number to look up in E.164 format, e.g. "+13125550001".',
			required: true,
		}),
		type: Property.StaticDropdown({
			displayName: 'Lookup Type',
			description: 'Extra data to include. Defaults to carrier data only.',
			required: false,
			options: {
				disabled: false,
				options: [
					{ label: 'Carrier', value: 'carrier' },
					{ label: 'Caller name', value: 'caller-name' },
				],
			},
		}),
	},
	async run(context) {
		const p = context.propsValue;
		return await telnyxApi.lookupPhoneNumber({
			auth: context.auth,
			phoneNumber: p.phoneNumber,
			query: telnyxUtils.toQuery({ values: { type: p.type } }),
		});
	},
});
