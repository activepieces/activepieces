import { createAction, Property } from '@activepieces/pieces-framework';

import { telnyxAuth } from '../../../auth';
import { telnyxAiProps } from '../../../common/ai-props';
import { telnyxApi } from '../../../common/api';
import { telnyxUtils } from '../../../common/utils';

export const telnyxUpdatePhoneNumberMessagingSettingsAction = createAction({
	auth: telnyxAuth,
	name: 'telnyx_update_phone_number_messaging_settings',
	displayName: 'Update Phone Number Messaging Settings',
	description: 'Assigns a phone number to a messaging profile or changes its messaging product.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Assigns a phone number to a messaging profile (needed before it can send or receive messages) and/or changes its messaging product or tags. Only the fields you set are sent.',
		idempotent: true,
	},
	props: {
		phoneNumberId: telnyxAiProps.phoneNumberId({ required: true }),
		messagingProfileId: telnyxAiProps.messagingProfileId({ required: false }),
		messagingProduct: Property.ShortText({
			displayName: 'Messaging Product',
			description:
				'Messaging product to use, one of the number\'s eligible_messaging_products from Get Phone Number Messaging Settings, e.g. "P2P".',
			required: false,
		}),
		tags: Property.Array({
			displayName: 'Tags',
			description: 'Replaces the full tag list.',
			required: false,
		}),
	},
	async run(context) {
		const p = context.propsValue;
		return await telnyxApi.updatePhoneNumberMessagingSettings({
			auth: context.auth,
			phoneNumberId: p.phoneNumberId,
			body: telnyxUtils.compact({
				values: {
					messaging_profile_id: p.messagingProfileId,
					messaging_product: p.messagingProduct,
					tags: p.tags,
				},
			}),
		});
	},
});
