import { Property, createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { beehiivAuth } from '../common/auth';
import { automationId, customFields, publicationId } from '../common/props';
import { beehiivApiCall } from '../common/client';

export const createSubscriptionAction = createAction({
	auth: beehiivAuth,
	name: 'create_subscription',
	classification: 'WRITE',
	displayName: 'Create Subscription',
	description: 'Creates a new subscription.',
	audience: 'both',
	aiMetadata: { description: 'Adds a new subscriber (by email) to a beehiiv publication, optionally setting tier, UTM attribution, custom fields, and enrolling them into automations on creation. Use to subscribe someone to a newsletter. Requires the publication ID and email; not idempotent — each call creates a subscription, and re-running may produce duplicate or reactivated subscribers.', idempotent: false },
	props: {
		publicationId: publicationId,
		email: Property.ShortText({
			displayName: 'Email',
			description: 'Email address to subscribe.',
			placeholder: 'jane@example.com',
			required: true,
		}),
		reactivate_existing: Property.Checkbox({
			displayName: 'Reactivate Existing',
			description: 'Resubscribe this email if it unsubscribed before, with their consent.',
			required: false,
			defaultValue: false,
		}),
		send_welcome_email: Property.Checkbox({
			displayName: 'Send Welcome Email',
			description: "Send the publication's welcome email to the new subscriber.",
			required: false,
			defaultValue: false,
		}),
		utm_source: Property.ShortText({
			displayName: 'UTM Source',
			placeholder: 'twitter',
			required: false,
			advanced: true,
		}),
		utm_medium: Property.ShortText({
			displayName: 'UTM Medium',
			placeholder: 'social',
			required: false,
			advanced: true,
		}),
		utm_campaign: Property.ShortText({
			displayName: 'UTM Campaign',
			placeholder: 'spring_launch',
			required: false,
			advanced: true,
		}),
		referring_site: Property.ShortText({
			displayName: 'Referring Site',
			placeholder: 'https://blog.example.com',
			required: false,
			advanced: true,
		}),
		referral_code: Property.ShortText({
			displayName: 'Referral Code',
			description: "A subscriber's referral code, to credit them for this signup.",
			required: false,
			advanced: true,
		}),
		tier: Property.StaticDropdown({
			displayName: 'Subscription Tier',
			required: false,
			width: 'half',
			options: {
				options: [
					{ label: 'Free', value: 'free' },
					{ label: 'Premium', value: 'premium' },
				],
			},
		}),
		custom_fields: customFields,
		stripe_customer_id: Property.ShortText({
			displayName: 'Stripe Customer ID',
			description: 'Links the subscriber to a Stripe customer.',
			placeholder: 'cus_123',
			required: false,
			width: 'half',
		}),
		double_opt_override: Property.ShortText({
			displayName: 'Double Opt-in Override',
			description: "Enter on or off to override the publication's double opt-in setting.",
			placeholder: 'on',
			required: false,
			advanced: true,
		}),
		premium_tier_ids: Property.Array({
			displayName: 'Premium Tier IDs',
			description: 'IDs of the premium tiers to give this subscriber.',
			required: false,
		}),
		automation_ids: automationId('Automations','Enroll the new subscriber in these automations.',false),
	},
	propertyGroups: [
		{
			key: 'subscriber',
			display: 'section',
			label: 'Subscriber',
			icon: 'user',
			props: ['publicationId', 'email', 'custom_fields'],
		},
		{
			key: 'signup',
			display: 'section',
			label: 'Sign-up',
			icon: 'send',
			props: ['reactivate_existing', 'send_welcome_email', 'automation_ids'],
		},
		{
			key: 'plan',
			display: 'section',
			label: 'Plan',
			icon: 'tag',
			props: ['tier', 'stripe_customer_id', 'premium_tier_ids'],
		},
	],
	async run(context) {
		const {
			publicationId,
			email,
			utm_campaign,
			utm_medium,
			tier,
			utm_source,
			reactivate_existing,
			referral_code,
			referring_site,
			send_welcome_email,
			stripe_customer_id,
			double_opt_override,
		} = context.propsValue;

		const customFields = context.propsValue.custom_fields ?? {};
		const automationIds = context.propsValue.automation_ids ?? [];
		const premiumTierIds = context.propsValue.premium_tier_ids ?? [];

		const transformedCustomFields = Object.entries(customFields)
			.filter(([_, value]) => {
				if (Array.isArray(value)) {
					return value.length > 0;
				}
				return value !== undefined && value !== null && value !== '';
			})
			.map(([key, value]) => ({
				name: key,
				value: value,
			}));

		const response = await beehiivApiCall({
			apiKey: context.auth.secret_text,
			method: HttpMethod.POST,
			resourceUri: `/publications/${publicationId}/subscriptions`,
			body: {
				email,
				reactivate_existing,
				send_welcome_email,
				utm_source,
				utm_campaign,
				utm_medium,
				referring_site,
				referral_code,
				double_opt_override,
				tier,
				premium_tier_ids: premiumTierIds.length > 0 ? premiumTierIds : undefined,
				stripe_customer_id,
				automation_ids: automationIds.length > 0 ? automationIds : undefined,
				custom_fields: transformedCustomFields.length > 0 ? transformedCustomFields : undefined,
			},
		});

		return response;
	},
});
