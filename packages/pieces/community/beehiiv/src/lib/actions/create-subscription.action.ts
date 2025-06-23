import { Property, createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { beehiivAuth } from '../common/auth';
import { automationId, customFields, publicationId } from '../common/props';
import { beehiivApiCall } from '../common/client';

export const createSubscriptionAction = createAction({
	auth: beehiivAuth,
	name: 'create_subscription',
	displayName: 'Create Subscription',
	description: 'Creates a new subscription.',
	props: {
		publicationId: publicationId,
		email: Property.ShortText({
			displayName: 'Email',
			description: 'The email address of the new subscription.',
			required: true,
		}),
		reactivate_existing: Property.Checkbox({
			displayName: 'Reactivate Existing',
			description:
				'Whether to reactivate the subscription if they have already unsubscribed. Use only if the subscription is knowingly resubscribing.',
			required: false,
			defaultValue: false,
		}),
		send_welcome_email: Property.Checkbox({
			displayName: 'Send Welcome Email',
			description: 'Whether to send the default welcome email to the subscription.',
			required: false,
			defaultValue: false,
		}),
		utm_source: Property.ShortText({
			displayName: 'UTM Source',
			description: 'The source of the subscription.',
			required: false,
		}),
		utm_medium: Property.ShortText({
			displayName: 'UTM Medium',
			description: 'The medium of the subscription.',
			required: false,
		}),
		utm_campaign: Property.ShortText({
			displayName: 'UTM Campaign',
			description: 'The acquisition campaign of the subscription.',
			required: false,
		}),
		referring_site: Property.ShortText({
			displayName: 'Referring Site',
			description: 'The website that the subscription was referred from.',
			required: false,
		}),
		referral_code: Property.ShortText({
			displayName: 'Referral Code',
			description: "A subscription's referral_code to give them credit for the new subscription.",
			required: false,
		}),
		tier: Property.StaticDropdown({
			displayName: 'Subscription Tier',
			description: 'The tier for this subscription.',
			required: false,
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
			description: 'The Stripe customer ID for this subscription.',
			required: false,
		}),
		double_opt_override: Property.ShortText({
			displayName: 'Double Opt-in Override',
			description: 'Override publication double-opt settings for this subscription.',
			required: false,
		}),
		premium_tier_ids: Property.Array({
			displayName: 'Premium Tier IDs',
			description: 'The IDs of the premium tiers this subscription is associated with.',
			required: false,
		}),
		automation_ids: automationId('Automation IDs','Enroll the subscription into automations after their subscription has been created.',false),
	},
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

		const response = await beehiivApiCall({
			apiKey: context.auth,
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
				custom_fields: Object.entries(customFields).map(([key, value]) => ({
					name: key,
					value: value,
				})),
			},
		});

		return response;
	},
});
