import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { pubrioAuth } from '../../index';
import { pubrioRequest } from '../common';

export const validateWebhook = createAction({
	auth: pubrioAuth,
	name: 'validate_webhook',
	displayName: 'Validate Webhook',
	description: 'Validate a webhook URL, email, or sequence identifier for monitor destinations',
	props: {
		destination_type: Property.StaticDropdown({
			displayName: 'Destination Type',
			required: true,
			options: {
				options: [
					{ label: 'Webhook', value: 'webhook' },
					{ label: 'Email', value: 'email' },
					{ label: 'Outreach Sequence', value: 'outreach_sequence' },
				],
			},
		}),
		webhook_url: Property.ShortText({ displayName: 'Webhook URL', required: false, description: 'Required when destination type is webhook' }),
		email: Property.ShortText({ displayName: 'Email', required: false, description: 'Required when destination type is email' }),
		sequence_identifier: Property.ShortText({ displayName: 'Sequence Identifier', required: false, description: 'Required when destination type is outreach_sequence' }),
		monitor_id: Property.ShortText({ displayName: 'Monitor ID', required: false }),
	},
	async run(context) {
		const body: Record<string, unknown> = {
			destination_type: context.propsValue.destination_type,
		};
		if (context.propsValue.webhook_url) body.webhook_url = context.propsValue.webhook_url;
		if (context.propsValue.email) body.email = context.propsValue.email;
		if (context.propsValue.sequence_identifier) body.sequence_identifier = context.propsValue.sequence_identifier;
		if (context.propsValue.monitor_id) body.monitor_id = context.propsValue.monitor_id;
		return await pubrioRequest(context.auth, HttpMethod.POST, '/monitors/webhook/validate', body);
	},
});
