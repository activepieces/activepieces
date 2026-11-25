import { createAction, Property } from '@activepieces/pieces-framework';

import { emailOctopusAuth } from '../../auth';
import { emailOctopusAiProps } from '../../common/ai-props';
import { emailOctopusApi } from '../../common/api';
import { emailOctopusUtils } from '../../common/utils';
import { contactOutputSchema } from '../../output-schemas';

export const createContactAction = createAction({
	auth: emailOctopusAuth,
	name: 'emailoctopus_create_contact',
	outputSchema: contactOutputSchema,
	displayName: 'Create Contact',
	description: 'Adds a new contact to a list.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Adds a new contact to an EmailOctopus list. Fails if a contact with that email is already in the list; use Create or Update Contact to upsert instead. Returns the contact with its ID.',
		idempotent: false,
	},
	props: {
		listId: emailOctopusAiProps.listId({ required: true }),
		emailAddress: Property.ShortText({
			displayName: 'Email Address',
			description: "The contact's email address.",
			required: true,
		}),
		fields: emailOctopusAiProps.fields({ required: false }),
		tags: Property.Array({
			displayName: 'Tags',
			description: 'Tag names to give the contact.',
			required: false,
		}),
		status: emailOctopusAiProps.status({
			required: false,
			description: 'The contact status. Defaults to subscribed.',
		}),
	},
	async run(context) {
		const { listId, emailAddress, fields, tags, status } = context.propsValue;
		const tagList = emailOctopusUtils.toStringArray({ value: tags, propName: 'Tags' });
		return await emailOctopusApi.createContact({
			auth: context.auth,
			listId,
			contact: {
				email_address: emailAddress,
				...(fields ? { fields } : {}),
				...(tagList.length > 0 ? { tags: tagList } : {}),
				...(status ? { status } : {}),
			},
		});
	},
});
