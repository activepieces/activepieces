import { createAction } from '@activepieces/pieces-framework';

import { zohoDeskAuth } from '../../../auth';
import { zohoDeskAiProps } from '../../../common/ai-props';
import { zohoDeskApi } from '../../../common/api';
import { zohoDeskProps } from '../../../common/props';
import { zohoDeskCreateContactOutputSchema } from '../../../output-schemas';

export const zohoDeskGetContactAction = createAction({
	auth: zohoDeskAuth,
	name: 'zoho_desk_get_contact',
	outputSchema: zohoDeskCreateContactOutputSchema,
	displayName: 'Get Contact',
	description: 'Gets a contact by ID.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			'Gets one contact by ID with all fields, including account, owner and custom fields (`cf`).',
		idempotent: true,
	},
	props: {
		orgId: zohoDeskProps.orgId({
			required: true,
			description: 'Zoho Desk organization ID (from List Organizations).',
		}),
		contactId: zohoDeskAiProps.contactId({ required: true }),
	},
	async run(context) {
		const { orgId, contactId } = context.propsValue;
		return await zohoDeskApi.getContact({ auth: context.auth, orgId, contactId });
	},
});
