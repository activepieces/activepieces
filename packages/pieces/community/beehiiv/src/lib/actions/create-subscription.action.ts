import { Property, createAction } from '@activepieces/pieces-framework';
import { beehiivAuth } from '../common/auth';
import { automationId, customFields, publicationId } from '../common/props';
import { apiKeyOf, beehiivClient, pathFor } from '../common/client';
import { DOUBLE_OPT_VALUES, aiInput } from '../common/ai-props';
import { beehiivOutputSchemas } from '../common/output-schemas';

export const createSubscriptionAction = createAction({
	auth: beehiivAuth,
	name: 'create_subscription',
	classification: 'WRITE',
	displayName: 'Create Subscription',
	description: 'Creates a new subscription.',
	audience: 'human',
	aiMetadata: { description: 'Adds a subscriber (by email) to a beehiiv publication with optional tier, UTM attribution, custom fields and automation enrollment. If the email already exists, beehiiv returns the existing subscription instead of creating a duplicate. Unknown custom field names are returned in warnings. Repeating with Automation IDs can enroll the subscriber again, and with Send Welcome Email = yes can resend the welcome email.', idempotent: false },
	outputSchema: beehiivOutputSchemas.humanCreateOrUpdateSubscription,
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
			description: 'Override the publication double opt-in setting for this subscriber: on, off or not_set.',
			required: false,
		}),
		premium_tier_ids: Property.Array({
			displayName: 'Premium Tier IDs',
			description: 'The IDs of the premium tiers this subscription is associated with.',
			required: false,
		}),
		automation_ids: automationId({
			displayName: 'Automation IDs',
			description: 'Enroll the subscription into automations after their subscription has been created. The automation needs an active "Add by API" trigger.',
		}),
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
		} = context.propsValue;
		const doubleOptOverride = aiInput.oneOf({ value: aiInput.optionalText(context.propsValue.double_opt_override)?.toLowerCase(), label: 'Double Opt-in Override', allowed: DOUBLE_OPT_VALUES });
		const customFields = Object.entries(context.propsValue.custom_fields ?? {})
			.filter(([, value]) => hasValue(value))
			.map(([name, value]) => ({ name, value }));
		const automationIds = aiInput.textList({ value: context.propsValue.automation_ids, label: 'Automation IDs' });
		const premiumTierIds = aiInput.textList({ value: context.propsValue.premium_tier_ids, label: 'Premium Tier IDs' });

		const response = await beehiivClient.request({
			apiKey: apiKeyOf(context.auth),
			method: 'POST',
			path: `${pathFor(['publications', publicationId])}/subscriptions`,
			operation: 'create subscription',
			body: {
				email,
				reactivate_existing,
				send_welcome_email,
				utm_source,
				utm_campaign,
				utm_medium,
				referring_site,
				referral_code,
				double_opt_override: doubleOptOverride,
				tier,
				premium_tier_ids: premiumTierIds,
				stripe_customer_id,
				automation_ids: automationIds,
				custom_fields: customFields.length > 0 ? customFields : undefined,
			},
		});

		return response.body;
	},
});

function hasValue(value: unknown): boolean {
	if (Array.isArray(value)) {
		return value.length > 0;
	}
	return value !== undefined && value !== null && value !== '';
}
