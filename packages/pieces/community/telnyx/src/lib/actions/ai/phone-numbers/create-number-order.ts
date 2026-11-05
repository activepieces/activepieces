import { createAction, Property } from '@activepieces/pieces-framework';

import { telnyxAuth } from '../../../auth';
import { telnyxAiProps } from '../../../common/ai-props';
import { telnyxApi } from '../../../common/api';
import { telnyxUtils } from '../../../common/utils';

export const telnyxCreateNumberOrderAction = createAction({
	auth: telnyxAuth,
	name: 'telnyx_create_number_order',
	displayName: 'Create Number Order',
	description: 'Buys phone numbers.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Buys the given phone numbers (from Search Available Phone Numbers) and charges the account. Optionally assigns them to a connection and messaging profile. Returns the order with its status; check it with Get Number Order. Not idempotent: repeating it can buy more numbers.',
		idempotent: false,
	},
	props: {
		phoneNumbers: Property.Array({
			displayName: 'Phone Numbers',
			description:
				'E.164 numbers to buy, e.g. ["+13125550001"], from Search Available Phone Numbers.',
			required: true,
		}),
		connectionId: telnyxAiProps.connectionId({ required: false }),
		messagingProfileId: telnyxAiProps.messagingProfileId({ required: false }),
		billingGroupId: Property.ShortText({
			displayName: 'Billing Group ID',
			description: 'Billing group to charge the numbers to.',
			required: false,
		}),
		customerReference: Property.ShortText({
			displayName: 'Customer Reference',
			description: 'Your own reference for the order.',
			required: false,
		}),
	},
	async run(context) {
		const p = context.propsValue;
		return await telnyxApi.createNumberOrder({
			auth: context.auth,
			body: telnyxUtils.compact({
				values: {
					phone_numbers: p.phoneNumbers.map((phoneNumber) => ({
						phone_number: phoneNumber,
					})),
					connection_id: p.connectionId,
					messaging_profile_id: p.messagingProfileId,
					billing_group_id: p.billingGroupId,
					customer_reference: p.customerReference,
				},
			}),
		});
	},
});
