import { createAction, Property } from '@activepieces/pieces-framework';

import { senderAuth } from '../../auth';
import { senderAiProps } from '../../common/ai-props';
import { senderApi } from '../../common/api';
import { senderUtils } from '../../common/utils';
import { senderSubscriberUpsertOutputSchema } from '../../output-schemas';

const STATUS_OPTIONS = [
	{ label: 'Active', value: 'ACTIVE' },
	{ label: 'Unsubscribed', value: 'UNSUBSCRIBED' },
	{ label: 'Bounced', value: 'BOUNCED' },
	{ label: 'Spam reported', value: 'SPAM_REPORTED' },
];

export const senderUpdateSubscriberAction = createAction({
	auth: senderAuth,
	name: 'sender_update_subscriber',
	outputSchema: senderSubscriberUpsertOutputSchema,
	displayName: 'Update Subscriber',
	description: "Updates a subscriber's details, groups or statuses.",
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			"Updates an existing subscriber, found by email, phone or ID: name, phone, groups, custom fields, and the email, SMS and transactional-email statuses. Set Email Status to Unsubscribed to unsubscribe someone without deleting them. Only the fields you set change: it reads the subscriber first and re-sends the current first and last name, which Sender would otherwise clear. Not safe against a concurrent edit of the same subscriber. Groups replaces the subscriber's group list; to add or remove single memberships use Add Subscribers to Group or Remove Subscribers from Group.",
		idempotent: true,
	},
	props: {
		subscriberId: senderAiProps.subscriberId({ required: true }),
		firstname: Property.ShortText({ displayName: 'First Name', required: false }),
		lastname: Property.ShortText({ displayName: 'Last Name', required: false }),
		phone: Property.ShortText({
			displayName: 'Phone',
			description: 'Phone number with country code, e.g. "+37061234567".',
			required: false,
		}),
		groups: senderAiProps.groups({ required: false }),
		fields: Property.Json({
			displayName: 'Custom Fields',
			description:
				'Object of custom field values keyed as {$<name>} with the field name from List Fields (without its braces), e.g. {"{$company}": "Acme"}. Unknown keys are skipped with a warning in message.warnings.',
			required: false,
		}),
		subscriberStatus: Property.StaticDropdown({
			displayName: 'Email Status',
			description: 'Email campaign status.',
			required: false,
			options: { disabled: false, options: STATUS_OPTIONS },
		}),
		smsStatus: Property.StaticDropdown({
			displayName: 'SMS Status',
			description: 'SMS campaign status.',
			required: false,
			options: { disabled: false, options: STATUS_OPTIONS },
		}),
		transactionalEmailStatus: Property.StaticDropdown({
			displayName: 'Transactional Email Status',
			description: 'Transactional email status.',
			required: false,
			options: { disabled: false, options: STATUS_OPTIONS },
		}),
		triggerAutomation: senderAiProps.triggerAutomation({ required: false }),
	},
	async run(context) {
		const {
			subscriberId,
			firstname,
			lastname,
			phone,
			groups,
			fields,
			subscriberStatus,
			smsStatus,
			transactionalEmailStatus,
			triggerAutomation,
		} = context.propsValue;
		const current = await senderApi.getSubscriber({ auth: context.auth, subscriberId });
		return await senderApi.updateSubscriber({
			auth: context.auth,
			subscriberId,
			firstname: firstname ?? current.firstname ?? undefined,
			lastname: lastname ?? current.lastname ?? undefined,
			phone,
			groups: senderUtils.optionalStringList({ value: groups, propName: 'Group IDs' }),
			customFields: fields,
			subscriberStatus,
			smsStatus,
			transactionalEmailStatus,
			triggerAutomation: senderUtils.yesNoToBoolean(triggerAutomation),
		});
	},
});
