import { createAction, Property } from '@activepieces/pieces-framework';
import { manychatAuth } from '../auth';
import { manychatClient, manychatUtils } from '../common/client';
import { manychatOutputSchemas } from '../common/output-schemas';

export const createTagAction = createAction({
	auth: manychatAuth,
	name: 'create_tag',
	classification: 'WRITE',
	displayName: 'Create Tag',
	description: 'Creates a new tag in the ManyChat account.',
	audience: 'both',
	aiMetadata: {
		description:
			'Creates a new tag in the ManyChat account and returns its ID and name. Check "List Tags" first, since the tag may already exist; then assign it with "Add Tag to User". Each call tries to create another tag.',
		idempotent: false,
	},
	outputSchema: manychatOutputSchemas.tag,
	props: {
		name: Property.ShortText({
			displayName: 'Tag Name',
			required: true,
		}),
	},
	async run({ auth, propsValue }) {
		const name = propsValue.name.trim();
		if (name === '') {
			throw new Error('Tag Name is required.');
		}
		const body = await manychatClient.request({
			apiKey: manychatUtils.apiKeyOf(auth),
			method: 'POST',
			path: '/page/createTag',
			operation: 'create tag',
			body: { name },
		});
		const data = manychatUtils.dataOf(body);
		const tag = manychatUtils.isRecord(data) ? data['tag'] : undefined;
		if (!manychatUtils.isRecord(tag)) {
			throw new Error('ManyChat accepted the tag but returned no tag details.');
		}
		return tag;
	},
});
