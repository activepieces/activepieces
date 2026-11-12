import { Property, createAction } from '@activepieces/pieces-framework';
import { beehiivAuth } from '../common/auth';
import { automationId, publicationId, subscriptionId } from '../common/props';
import { apiKeyOf, beehiivClient, pathFor } from '../common/client';
import { DOUBLE_OPT_VALUES, aiInput } from '../common/ai-props';
import { beehiivOutputSchemas } from '../common/output-schemas';

export const addSubscriptionToAutomationAction = createAction({
	auth: beehiivAuth,
	name: 'add_subscription_to_automation',
	classification: 'WRITE',
	displayName: 'Add Subscription to Automation',
	description: 'Adds an existing subscription to an automation. The automation must have an active "Add by API" trigger.',
	audience: 'both',
	aiMetadata: {
		description:
			'Starts a beehiiv automation journey for an existing subscriber. Give exactly one of Subscription Email or Subscription ID, never both. The automation must be live with "api" in its trigger_events (see "List Automations"). Double Opt-in Override takes on, off or not_set. Each call can start another journey, so do not repeat it.',
		idempotent: false,
	},
	outputSchema: beehiivOutputSchemas.humanAddToAutomation,
	props: {
		publicationId: publicationId,
		automationId: automationId({ displayName: 'Automation ID', description: 'Only automations with an active "Add by API" trigger accept subscribers.', required: true }),
		email: Property.ShortText({
			displayName: 'Subscription Email',
			description: 'The email address of the subscription. Provide either Email or Subscription ID.',
			required: false,
		}),
		subscription_id: subscriptionId(),
		double_opt_override: Property.ShortText({
			displayName: 'Double Opt-in Override',
			description: 'Override the publication double opt-in setting for this subscriber: on, off or not_set.',
			required: false,
		}),
	},
	async run(context) {
		const { publicationId, automationId, email, subscription_id } = context.propsValue;
		const emailText = aiInput.optionalText(email);
		const subscriptionIdText = aiInput.optionalText(subscription_id);
		if (emailText === undefined && subscriptionIdText === undefined) {
			throw new Error('Either Subscription Email or Subscription ID must be provided.');
		}
		const doubleOptOverride = aiInput.oneOf({ value: aiInput.optionalText(context.propsValue.double_opt_override)?.toLowerCase(), label: 'Double Opt-in Override', allowed: DOUBLE_OPT_VALUES });

		const response = await beehiivClient.request({
			apiKey: apiKeyOf(context.auth),
			method: 'POST',
			path: `${pathFor(['publications', publicationId, 'automations', aiInput.requireText({ value: automationId, label: 'Automation ID' })])}/journeys`,
			operation: 'add subscription to automation',
			body: {
				email: emailText,
				subscription_id: subscriptionIdText,
				double_opt_override: doubleOptOverride,
			},
		});

		return response.body;
	},
});
