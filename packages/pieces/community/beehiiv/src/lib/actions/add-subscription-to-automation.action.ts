import { MarkdownVariant, Property, createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { beehiivAuth } from '../common/auth';
import { automationId, publicationId, subscriptionId } from '../common/props';
import { beehiivApiCall } from '../common/client';

export const addSubscriptionToAutomationAction = createAction({
	auth: beehiivAuth,
	name: 'add_subscription_to_automation',
	classification: 'WRITE',
	displayName: 'Add Subscription to Automation',
	description: 'Adds an existing subscription to a specific automation flow.',
	audience: 'both',
	aiMetadata: { description: 'Enrolls an existing subscriber into a beehiiv automation journey for the given publication and automation ID. The subscriber can be identified either by email or by subscription ID — provide exactly one. Use to start a subscriber on an automation. Not idempotent: each call creates a new journey enrollment.', idempotent: false },
	props: {
		publicationId: publicationId,
		automationId: automationId('Automation', 'Inactive automations are not listed.', true, true),
		subscriber_info: Property.MarkDown({
			value: 'Enter an email or pick a subscriber, not both.',
			variant: MarkdownVariant.INFO,
		}),
		email: Property.ShortText({
			displayName: 'Email',
			placeholder: 'jane@example.com',
			required: false,
		}),
		subscription_id:subscriptionId(),
		double_opt_override: Property.ShortText({
			displayName: 'Double Opt-in Override',
			description: "Enter on or off to override the publication's double opt-in setting.",
			placeholder: 'on',
			required: false,
			advanced: true,
		}),
	},
	propertyGroups: [
		{
			key: 'automation',
			display: 'section',
			label: 'Automation',
			icon: 'send',
			props: ['publicationId', 'automationId'],
		},
		{
			key: 'subscriber',
			display: 'section',
			label: 'Subscriber',
			icon: 'user',
			props: ['subscriber_info', 'email', 'subscription_id'],
		},
	],
	async run(context) {
		const { publicationId, automationId, email, subscription_id, double_opt_override } =
			context.propsValue;

		if (!email && !subscription_id) {
			throw new Error('Enter an email or pick a subscriber.');
		}

		const body: Record<string, unknown> = {};
		if (email) {
			body['email'] = email;
		}
		if (subscription_id) {
			body['subscription_id'] = subscription_id;
		}
		if (double_opt_override) {
			body['double_opt_override'] = double_opt_override;
		}

		const response = await beehiivApiCall({
			apiKey: context.auth.secret_text,
			method: HttpMethod.POST,
			resourceUri: `/publications/${publicationId}/automations/${automationId}/journeys`,
			body,
		});

		return response;
	},
});
