import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoDeskAuth } from '../../../auth';
import { zohoDeskApi } from '../../../common/api';
import { zohoDeskProps } from '../../../common/props';
import { zohoDeskUtils } from '../../../common/utils';
import { zohoDeskMergeContactsOutputSchema } from '../../../output-schemas';

export const zohoDeskMergeContactsAction = createAction({
	auth: zohoDeskAuth,
	name: 'zoho_desk_merge_contacts',
	outputSchema: zohoDeskMergeContactsOutputSchema,
	displayName: 'Merge Contacts',
	description: 'Merges other contacts into one contact.',
	audience: 'ai',
	classification: 'DESTRUCTIVE',
	aiMetadata: {
		description:
			'Merges the listed contacts into the target contact, moving their tickets to it; the merged contacts are removed. This cannot be undone.',
		idempotent: false,
	},
	props: {
		orgId: zohoDeskProps.orgId({
			required: true,
			description: 'Zoho Desk organization ID (from List Organizations).',
		}),
		contactId: Property.ShortText({
			displayName: 'Target Contact ID',
			description: 'ID of the contact the others are merged into.',
			required: true,
		}),
		contactIds: Property.Array({
			displayName: 'Contact IDs',
			description: 'IDs of the contacts to merge into the target contact.',
			required: true,
		}),
	},
	async run(context) {
		const { orgId, contactId, contactIds } = context.propsValue;
		return await zohoDeskApi.mergeContacts({
			auth: context.auth,
			orgId,
			contactId,
			contactIds: zohoDeskUtils.requiredStringList({ value: contactIds, propName: 'Contact IDs' }),
		});
	},
});
