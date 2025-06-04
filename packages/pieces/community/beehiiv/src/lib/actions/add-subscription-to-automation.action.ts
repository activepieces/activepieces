import { Property, createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { beehiivAuth } from '../common/auth';
import { automationId, publicationId, subscriptionId } from '../common/props';
import { beehiivApiCall } from '../common/client';

export const addSubscriptionToAutomationAction = createAction({
	auth: beehiivAuth,
	name: 'add_subscription_to_automation',
	displayName: 'Add Subscription to Automation',
	description: 'Adds an existing subscription to a specific automation flow.',
	props: {
		publicationId: publicationId,
		automationId: automationId('Automation ID', '', true,true),
		email: Property.ShortText({
			displayName: 'Subscription Email',
			description: 'The email address of the subscription. Provide either Email or Subscription ID.',
			required: false,
		}),
		subscription_id:subscriptionId(),
		double_opt_override: Property.ShortText({
			displayName: 'Double Opt-in Override',
			description: 'Override publication double-opt settings for this subscription (e.g., "on").',
			required: false,
		}),
	},
	async run(context) {
		const { publicationId, automationId, email, subscription_id, double_opt_override } =
			context.propsValue;

		if (!email && !subscription_id) {
			throw new Error('Either Subscription Email or Subscription ID must be provided.');
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
			apiKey: context.auth,
			method: HttpMethod.POST,
			resourceUri: `/publications/${publicationId}/automations/${automationId}/journeys`,
			body,
		});

		return response;
	},
});
