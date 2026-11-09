import { createAction, Property } from '@activepieces/pieces-framework';

import { emailOctopusAuth } from '../../auth';
import { emailOctopusAiProps } from '../../common/ai-props';
import { emailOctopusApi } from '../../common/api';
import { updateContactsBatchOutputSchema } from '../../output-schemas';

import type { EmailOctopusContactBatchItem } from '../../common/types';

export const updateContactsBatchAction = createAction({
	auth: emailOctopusAuth,
	name: 'emailoctopus_update_contacts_batch',
	outputSchema: updateContactsBatchOutputSchema,
	displayName: 'Update Contacts in Batch',
	description: 'Updates up to 100 contacts in a list in one call.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Updates up to 100 existing contacts in one EmailOctopus list in a single call. Each item needs the contact `id` (UUID from Get Contact or List Contacts, not an email) plus any of `email_address`, `fields`, `tags` (object of tag name to true/false) and `status`. Items that fail are returned in `failed` while the rest are applied.',
		idempotent: true,
	},
	props: {
		listId: emailOctopusAiProps.listId({ required: true }),
		contacts: Property.Array({
			displayName: 'Contacts',
			description:
				'1-100 objects like {"id": "<contact UUID>", "status": "unsubscribed", "tags": {"vip": true}, "fields": {"FirstName": "Ada"}}.',
			required: true,
		}),
	},
	async run(context) {
		const { listId, contacts } = context.propsValue;
		if (contacts.length < 1 || contacts.length > 100) {
			throw new Error(`Contacts must have 1-100 items; got ${contacts.length}.`);
		}
		if (!contacts.every(isBatchItem)) {
			throw new Error('Every item in Contacts must be an object with a string "id".');
		}
		const result = await emailOctopusApi.updateContactsBatch({
			auth: context.auth,
			listId,
			contacts,
		});
		const updated = (result.success ?? []).map((item) => item.data);
		const failed = result.errors ?? [];
		return {
			success: failed.length === 0,
			updated_count: updated.length,
			updated,
			failed,
		};
	},
});

function isBatchItem(item: unknown): item is EmailOctopusContactBatchItem {
	return (
		typeof item === 'object' &&
		item !== null &&
		'id' in item &&
		typeof item.id === 'string' &&
		item.id !== ''
	);
}
