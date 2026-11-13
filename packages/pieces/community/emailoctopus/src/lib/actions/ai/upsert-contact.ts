import { createAction, Property } from '@activepieces/pieces-framework';

import { emailOctopusAuth } from '../../auth';
import { emailOctopusAiProps } from '../../common/ai-props';
import { emailOctopusApi } from '../../common/api';
import { emailOctopusUtils } from '../../common/utils';
import { contactOutputSchema } from '../../output-schemas';

export const upsertContactAction = createAction({
	auth: emailOctopusAuth,
	name: 'emailoctopus_upsert_contact',
	outputSchema: contactOutputSchema,
	displayName: 'Create or Update Contact',
	description: 'Creates a contact in a list, or updates it if the email already exists.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Creates a contact in an EmailOctopus list, or updates the existing contact with the same email address. Only the fields, fields to clear, tags and status you pass change. Use Create Contact when a duplicate should fail instead.',
		idempotent: true,
	},
	props: {
		listId: emailOctopusAiProps.listId({ required: true }),
		emailAddress: Property.ShortText({
			displayName: 'Email Address',
			description: "The contact's email address, used to match an existing contact.",
			required: true,
		}),
		fields: emailOctopusAiProps.fields({ required: false }),
		fieldsToClear: emailOctopusAiProps.fieldsToClear({ required: false }),
		tagsToAdd: emailOctopusAiProps.tagsToAdd({ required: false }),
		tagsToRemove: emailOctopusAiProps.tagsToRemove({ required: false }),
		status: emailOctopusAiProps.status({ required: false }),
	},
	async run(context) {
		const { listId, emailAddress, fields, fieldsToClear, tagsToAdd, tagsToRemove, status } =
			context.propsValue;
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
		return await emailOctopusApi.putContact({
			auth: context.auth,
			listId,
			body: {
				email_address: emailAddress,
				...(fieldChanges ? { fields: fieldChanges } : {}),
				...(tags ? { tags } : {}),
				...(status ? { status } : {}),
			},
		});
	},
});
