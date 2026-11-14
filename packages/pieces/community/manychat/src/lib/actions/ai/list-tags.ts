import { createAction, Property } from '@activepieces/pieces-framework';
import { manychatAuth } from '../../auth';
import { manychatClient, manychatUtils } from '../../common/client';
import { manychatInput } from '../../common/props';
import { manychatOutputSchemas } from '../../common/output-schemas';

export const listTagsAiAction = createAction({
	auth: manychatAuth,
	name: 'list_tags',
	classification: 'SEARCH',
	displayName: 'List Tags',
	description: 'Lists every tag in the ManyChat account.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Lists every tag in the ManyChat account (ID and name), optionally filtered by a case-insensitive name fragment. Use it to find the tag ID for "Add Tag to User" or "Remove Tag from User", or to check a tag exists before "Create Tag". Read-only.',
		idempotent: true,
	},
	outputSchema: manychatOutputSchemas.listTags,
	props: {
		name_contains: Property.ShortText({
			displayName: 'Name Contains',
			description: 'Only tags whose name contains this text (case-insensitive). Leave empty for all.',
			required: false,
		}),
	},
	async run({ auth, propsValue }) {
		const filter = manychatInput.optionalText(propsValue.name_contains)?.toLowerCase();
		const body = await manychatClient.request({ apiKey: manychatUtils.apiKeyOf(auth), method: 'GET', path: '/page/getTags', operation: 'list tags' });
		const tags = manychatUtils.recordsOf(manychatUtils.dataOf(body)).filter((tag) => filter === undefined || String(tag['name'] ?? '').toLowerCase().includes(filter));
		return { tags, count: tags.length };
	},
});
