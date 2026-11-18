import { createAction } from '@activepieces/pieces-framework';

import { emailOctopusAuth } from '../../auth';
import { emailOctopusAiProps } from '../../common/ai-props';
import { emailOctopusApi } from '../../common/api';
import { contactOutputSchema } from '../../output-schemas';

export const getContactAction = createAction({
	auth: emailOctopusAuth,
	name: 'emailoctopus_get_contact',
	outputSchema: contactOutputSchema,
	displayName: 'Get Contact',
	description: 'Gets one contact in a list by ID or email address.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			'Gets one contact in an EmailOctopus list by contact ID or email address, with its fields, tags and status. Fails with 404 when the contact is not in the list. Use List Contacts to browse or filter instead.',
		idempotent: true,
	},
	props: {
		listId: emailOctopusAiProps.listId({ required: true }),
		contact: emailOctopusAiProps.contact({ required: true }),
	},
	async run(context) {
		const { listId, contact } = context.propsValue;
		return await emailOctopusApi.getContact({ auth: context.auth, listId, contact });
	},
});
