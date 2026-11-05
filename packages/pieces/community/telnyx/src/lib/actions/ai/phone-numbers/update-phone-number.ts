import { createAction, Property } from '@activepieces/pieces-framework';

import { telnyxAuth } from '../../../auth';
import { telnyxAiProps } from '../../../common/ai-props';
import { telnyxApi } from '../../../common/api';
import { telnyxUtils } from '../../../common/utils';

export const telnyxUpdatePhoneNumberAction = createAction({
	auth: telnyxAuth,
	name: 'telnyx_update_phone_number',
	displayName: 'Update Phone Number',
	description: 'Updates a phone number, keeping every setting you leave empty.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			"Updates a phone number's connection, tags, customer reference, billing group, port-out PIN or HD voice. Only the fields you set are sent. Tags replaces the full list. For messaging or voice settings use the dedicated update actions.",
		idempotent: true,
	},
	props: {
		phoneNumberId: telnyxAiProps.phoneNumberId({ required: true }),
		connectionId: telnyxAiProps.connectionId({ required: false }),
		tags: Property.Array({
			displayName: 'Tags',
			description: 'Replaces the full tag list.',
			required: false,
		}),
		customerReference: Property.ShortText({
			displayName: 'Customer Reference',
			description: 'Your own reference for the number.',
			required: false,
		}),
		billingGroupId: Property.ShortText({
			displayName: 'Billing Group ID',
			description: 'Billing group to charge the number to.',
			required: false,
		}),
		externalPin: Property.ShortText({
			displayName: 'External PIN',
			description: 'PIN required to port the number out.',
			required: false,
		}),
		addressId: Property.ShortText({
			displayName: 'Address ID',
			description: 'Address ID to associate with the number.',
			required: false,
		}),
		hdVoiceEnabled: telnyxAiProps.optionalBoolean({
			required: false,
			displayName: 'HD Voice',
			description: 'Whether HD voice is enabled.',
		}),
	},
	async run(context) {
		const p = context.propsValue;
		return await telnyxApi.updatePhoneNumber({
			auth: context.auth,
			phoneNumberId: p.phoneNumberId,
			body: telnyxUtils.compact({
				values: {
					connection_id: p.connectionId,
					tags: p.tags,
					customer_reference: p.customerReference,
					billing_group_id: p.billingGroupId,
					external_pin: p.externalPin,
					address_id: p.addressId,
					hd_voice_enabled: p.hdVoiceEnabled,
				},
			}),
		});
	},
});
