import { Property, createAction } from '@activepieces/pieces-framework';
import { beehiivAuth } from '../../common/auth';
import { apiKeyOf, beehiivClient, pathFor } from '../../common/client';
import { DOUBLE_OPT_VALUES, aiInput, aiProps } from '../../common/ai-props';
import { beehiivOutputSchemas } from '../../common/output-schemas';

export const createSubscriptionAiAction = createAction({
	auth: beehiivAuth,
	name: 'create_subscription_ai',
	classification: 'WRITE',
	displayName: 'Create Subscription (AI)',
	description: 'Adds a subscriber to a publication.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Adds a subscriber to a beehiiv publication by email, with optional tier, UTM attribution, custom fields, newsletter lists and automations. If the email already exists beehiiv returns that same subscription (no duplicate record) and applies the given custom fields. Custom field names must already exist ("List Custom Fields"); unknown names come back in warnings and are not saved. Repeating with Automation IDs can enroll the subscriber again, and with Send Welcome Email = yes can resend the welcome email.',
		idempotent: false,
	},
	outputSchema: beehiivOutputSchemas.writeSubscription,
	props: {
		publication_id: aiProps.publicationId(),
		email: Property.ShortText({ displayName: 'Email', description: 'The subscriber email address.', required: true }),
		send_welcome_email: aiProps.yesNo({ displayName: 'Send Welcome Email', description: 'Yes to send the publication welcome email.' }),
		reactivate_existing: aiProps.yesNo({ displayName: 'Reactivate Existing', description: 'Yes to resubscribe someone who unsubscribed earlier. Only use when they asked to come back.' }),
		double_opt_override: Property.StaticDropdown<string>({
			displayName: 'Double Opt-in',
			description: 'on sends a confirmation email first, off subscribes at once, not_set uses the publication setting (default).',
			required: false,
			options: { options: DOUBLE_OPT_VALUES.map((value) => ({ label: value, value })) },
		}),
		tier: Property.StaticDropdown<string>({
			displayName: 'Tier',
			description: 'free or premium. Leave empty for the default.',
			required: false,
			options: {
				options: [
					{ label: 'Free', value: 'free' },
					{ label: 'Premium', value: 'premium' },
				],
			},
		}),
		premium_tier_ids: Property.Array({ displayName: 'Premium Tier IDs', description: 'Tier IDs from "List Tiers".', required: false }),
		custom_fields: Property.Object({
			displayName: 'Custom Fields',
			description: 'Field name to value, for example {"First Name": "Ada"}. Names come from "List Custom Fields".',
			required: false,
		}),
		newsletter_list_ids: Property.Array({ displayName: 'Newsletter List IDs', description: 'Newsletter list IDs from "List Newsletter Lists".', required: false }),
		automation_ids: Property.Array({
			displayName: 'Automation IDs',
			description: 'Automation IDs from "List Automations" whose trigger events include "api".',
			required: false,
		}),
		utm_source: Property.ShortText({ displayName: 'UTM Source', required: false }),
		utm_medium: Property.ShortText({ displayName: 'UTM Medium', required: false }),
		utm_campaign: Property.ShortText({ displayName: 'UTM Campaign', required: false }),
		utm_term: Property.ShortText({ displayName: 'UTM Term', required: false }),
		utm_content: Property.ShortText({ displayName: 'UTM Content', required: false }),
		referring_site: Property.ShortText({ displayName: 'Referring Site', required: false }),
		referral_code: Property.ShortText({ displayName: 'Referral Code', description: 'Referral code of the subscriber who referred this one.', required: false }),
		stripe_customer_id: Property.ShortText({ displayName: 'Stripe Customer ID', required: false }),
	},
	async run({ auth, propsValue }) {
		const publicationId = aiInput.requireText({ value: propsValue.publication_id, label: 'Publication ID' });
		const email = aiInput.requireText({ value: propsValue.email, label: 'Email' });
		if (!email.includes('@')) {
			throw new Error('Email must be a full email address.');
		}
		const response = await beehiivClient.request({
			apiKey: apiKeyOf(auth),
			method: 'POST',
			path: `${pathFor(['publications', publicationId])}/subscriptions`,
			operation: 'create subscription',
			body: {
				email,
				send_welcome_email: aiInput.yesNo({ value: propsValue.send_welcome_email, label: 'Send Welcome Email' }),
				reactivate_existing: aiInput.yesNo({ value: propsValue.reactivate_existing, label: 'Reactivate Existing' }),
				double_opt_override: aiInput.oneOf({ value: propsValue.double_opt_override, label: 'Double Opt-in', allowed: DOUBLE_OPT_VALUES }),
				tier: aiInput.oneOf({ value: propsValue.tier, label: 'Tier', allowed: ['free', 'premium'] }),
				premium_tier_ids: aiInput.textList({ value: propsValue.premium_tier_ids, label: 'Premium Tier IDs' }),
				custom_fields: aiInput.customFieldEntries({ value: propsValue.custom_fields, label: 'Custom Fields' }),
				newsletter_list_ids: aiInput.textList({ value: propsValue.newsletter_list_ids, label: 'Newsletter List IDs' }),
				automation_ids: aiInput.textList({ value: propsValue.automation_ids, label: 'Automation IDs' }),
				utm_source: aiInput.optionalText(propsValue.utm_source),
				utm_medium: aiInput.optionalText(propsValue.utm_medium),
				utm_campaign: aiInput.optionalText(propsValue.utm_campaign),
				utm_term: aiInput.optionalText(propsValue.utm_term),
				utm_content: aiInput.optionalText(propsValue.utm_content),
				referring_site: aiInput.optionalText(propsValue.referring_site),
				referral_code: aiInput.optionalText(propsValue.referral_code),
				stripe_customer_id: aiInput.optionalText(propsValue.stripe_customer_id),
			},
		});
		return { subscription: aiInput.dataOf(response.body), warnings: aiInput.warningsOf(response.body) };
	},
});
