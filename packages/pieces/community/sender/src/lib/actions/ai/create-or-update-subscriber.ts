import { createAction, Property } from '@activepieces/pieces-framework';

import { senderAuth } from '../../auth';
import { senderAiProps } from '../../common/ai-props';
import { senderApi } from '../../common/api';
import { senderUtils } from '../../common/utils';
import { senderSubscriberUpsertOutputSchema } from '../../output-schemas';

export const senderCreateOrUpdateSubscriberAction = createAction({
	auth: senderAuth,
	name: 'sender_create_or_update_subscriber',
	outputSchema: senderSubscriberUpsertOutputSchema,
	displayName: 'Create or Update Subscriber',
	description: 'Adds a subscriber, or updates the one with the same email.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Adds a subscriber to the Sender account by email, or updates the existing subscriber with that email (name, phone, groups and custom fields). To change statuses or edit by ID use Update Subscriber. Keyed on email, so repeating the call does not create a duplicate.',
		idempotent: true,
	},
	props: {
		email: Property.ShortText({
			displayName: 'Email',
			description: 'Subscriber email address.',
			required: true,
		}),
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
		triggerAutomation: senderAiProps.triggerAutomation({ required: false }),
	},
	async run(context) {
		const { email, firstname, lastname, phone, groups, fields, triggerAutomation } =
			context.propsValue;
		return await senderApi.upsertSubscriber({
			auth: context.auth,
			email,
			firstname,
			lastname,
			phone,
			groups: senderUtils.optionalStringList({ value: groups, propName: 'Group IDs' }),
			customFields: fields,
			triggerAutomation: senderUtils.yesNoToBoolean(triggerAutomation),
		});
	},
});
