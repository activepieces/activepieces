import { createAction } from '@activepieces/pieces-framework';
import { manychatAuth } from '../auth';
import { manychatClient, manychatUtils } from '../common/client';
import { manychatData, manychatInput, subscriberId, tagIdDropdown } from '../common/props';
import { manychatOutputSchemas } from '../common/output-schemas';

export const addTagToUserAction = createAction({
	auth: manychatAuth,
	name: 'addTagToUser',
	classification: 'WRITE',
	displayName: 'Add Tag to User',
	description: 'Adds a tag to a user and returns the updated user.',
	audience: 'both',
	aiMetadata: {
		description:
			'Assigns an existing tag to a ManyChat subscriber by subscriber ID and tag ID, then returns the updated subscriber. Use to label or segment a known contact; get tag IDs from "List Tags" and create new ones with "Create Tag". Re-adding a tag the subscriber already has leaves the same state.',
		idempotent: true,
	},
	outputSchema: manychatOutputSchemas.subscriber,
	props: {
		subscriberId: subscriberId,
		tagId: tagIdDropdown,
	},
	async run({ auth, propsValue }) {
		const apiKey = manychatUtils.apiKeyOf(auth);
		const id = manychatInput.subscriberIdText({ value: propsValue.subscriberId, label: 'User ID' });
		await manychatClient.request({
			apiKey,
			method: 'POST',
			path: '/subscriber/addTag',
			operation: 'add tag to subscriber',
			body: { subscriber_id: manychatInput.apiId(id), tag_id: propsValue.tagId },
		});
		return manychatData.getSubscriber({ apiKey, subscriberId: id });
	},
});
