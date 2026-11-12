import { Property, createAction } from '@activepieces/pieces-framework';
import { customFields, publicationId, subscriptionId } from '../common/props';
import { beehiivAuth } from '../common/auth';
import { apiKeyOf, beehiivClient, pathFor } from '../common/client';
import { aiInput } from '../common/ai-props';
import { beehiivOutputSchemas } from '../common/output-schemas';

export const updateSubscriptionAction = createAction({
	auth: beehiivAuth,
	name: 'update_subscription',
	classification: 'WRITE',
	displayName: 'Update Subscription',
	description: 'Update an existing subscription. Fields you leave empty are not changed.',
	audience: 'human',
	aiMetadata: {
		description:
			'Updates an existing beehiiv subscription by publication and subscription ID: tier, Stripe customer ID, custom fields, or unsubscribe. Fields left empty are not changed. Repeating the same update leaves the same end state.',
		idempotent: true,
	},
	outputSchema: beehiivOutputSchemas.humanCreateOrUpdateSubscription,
	props: {
		publicationId: publicationId,
		subscriptionId: subscriptionId(true),
		tier: Property.StaticDropdown({
			displayName: 'Subscription Tier',
			description: 'Set the tier for this subscription.',
			required: false,
			options: {
				options: [
					{ label: 'Free', value: 'free' },
					{ label: 'Premium', value: 'premium' },
				],
			},
		}),
		stripe_customer_id: Property.ShortText({
			displayName: 'Stripe Customer ID',
			description: 'The Stripe Customer ID of the subscription.',
			required: false,
		}),
		unsubscribe: Property.Checkbox({
			displayName: 'Unsubscribe',
			description: 'Check to unsubscribe this subscription from the publication. Leaving it unchecked changes nothing.',
			required: false,
		}),
		custom_fields: customFields,
	},
	async run(context) {
		const { publicationId, subscriptionId, tier, stripe_customer_id, unsubscribe } = context.propsValue;

		const transformedCustomFields = Object.entries(context.propsValue.custom_fields ?? {})
			.filter(([, value]) => {
				if (Array.isArray(value)) {
					return value.length > 0;
				}
				return value !== undefined && value !== null && value !== '';
			})
			.map(([name, value]) => ({ name, value }));

		const body: Record<string, unknown> = {};
		if (tier !== undefined && tier !== null && tier !== '') {
			body['tier'] = tier;
		}
		if (stripe_customer_id !== undefined && stripe_customer_id !== null && stripe_customer_id !== '') {
			body['stripe_customer_id'] = stripe_customer_id;
		}
		if (unsubscribe === true) {
			body['unsubscribe'] = true;
		}
		if (transformedCustomFields.length > 0) {
			body['custom_fields'] = transformedCustomFields;
		}

		const response = await beehiivClient.request({
			apiKey: apiKeyOf(context.auth),
			method: 'PUT',
			path: pathFor(['publications', publicationId, 'subscriptions', aiInput.requireText({ value: subscriptionId, label: 'Subscription ID' })]),
			operation: 'update subscription',
			body,
		});

		return response.body;
	},
});
