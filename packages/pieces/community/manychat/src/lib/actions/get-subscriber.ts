import { createAction } from '@activepieces/pieces-framework';
import { manychatAuth } from '../auth';
import { manychatUtils } from '../common/client';
import { manychatData, manychatInput, manychatProps } from '../common/props';
import { manychatOutputSchemas } from '../common/output-schemas';

export const getSubscriberAction = createAction({
	auth: manychatAuth,
	name: 'get_subscriber',
	classification: 'READ',
	displayName: 'Get Subscriber',
	description: 'Gets a subscriber by ID, with their tags and custom field values.',
	audience: 'both',
	aiMetadata: {
		description:
			'Gets one ManyChat subscriber by subscriber ID, including contact details, opt-ins, last interaction, tags and custom field values. Use when you already have the ID; to look one up by email or phone use "Find Subscriber by Email or Phone". Read-only.',
		idempotent: true,
	},
	outputSchema: manychatOutputSchemas.subscriber,
	props: {
		subscriber_id: manychatProps.subscriberIdText(),
	},
	async run({ auth, propsValue }) {
		return manychatData.getSubscriber({
			apiKey: manychatUtils.apiKeyOf(auth),
			subscriberId: manychatInput.subscriberIdText({ value: propsValue.subscriber_id }),
		});
	},
});
