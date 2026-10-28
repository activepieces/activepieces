import { createAction, Property } from '@activepieces/pieces-framework';

import { emailOctopusAuth } from '../../auth';
import { emailOctopusAiProps } from '../../common/ai-props';
import { emailOctopusApi } from '../../common/api';
import { emailOctopusUtils } from '../../common/utils';
import { contactOutputSchema } from '../../output-schemas';

export const updateContactAction = createAction({
	auth: emailOctopusAuth,
	name: 'emailoctopus_update_contact',
	outputSchema: contactOutputSchema,
	displayName: 'Update Contact',
	description: "Updates a contact's email, fields, tags or status.",
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Updates an existing contact in an EmailOctopus list, found by contact ID or email address. Only what you pass changes: new email, field values, fields to clear, tags to add or remove, and status (set unsubscribed to opt the contact out, subscribed to opt back in). Not idempotent when the email changes, because the old email no longer finds the contact; pass the contact ID to repeat safely.',
		idempotent: false,
	},
	props: {
		listId: emailOctopusAiProps.listId({ required: true }),
		contact: emailOctopusAiProps.contact({ required: true }),
		newEmailAddress: Property.ShortText({
			displayName: 'New Email Address',
			description: 'A new email address for the contact.',
			required: false,
		}),
		fields: emailOctopusAiProps.fields({ required: false }),
		fieldsToClear: emailOctopusAiProps.fieldsToClear({ required: false }),
		tagsToAdd: emailOctopusAiProps.tagsToAdd({ required: false }),
		tagsToRemove: emailOctopusAiProps.tagsToRemove({ required: false }),
		status: emailOctopusAiProps.status({ required: false }),
	},
	async run(context) {
		const {
			listId,
			contact,
			newEmailAddress,
			fields,
			fieldsToClear,
			tagsToAdd,
			tagsToRemove,
			status,
		} = context.propsValue;
		const fieldChanges = emailOctopusUtils.toFieldChanges({
			fields,
			fieldsToClear: emailOctopusUtils.toStringArray({
				value: fieldsToClear,
				propName: 'Fields to Clear',
			}),
		});
		const tags = emailOctopusUtils.toTagChanges({
			tagsToAdd: emailOctopusUtils.toStringArray({ value: tagsToAdd, propName: 'Tags to Add' }),
			tagsToRemove: emailOctopusUtils.toStringArray({
				value: tagsToRemove,
				propName: 'Tags to Remove',
			}),
		});
		return await emailOctopusApi.updateContact({
			auth: context.auth,
			listId,
			contact,
			update: {
				...(newEmailAddress ? { email_address: newEmailAddress } : {}),
				...(fieldChanges ? { fields: fieldChanges } : {}),
				...(tags ? { tags } : {}),
				...(status ? { status } : {}),
			},
		});
	},
});
