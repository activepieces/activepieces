import { createAction } from '@activepieces/pieces-framework';
import { manychatAuth } from '../auth';
import { ManychatApiError, manychatClient, manychatUtils } from '../common/client';
import { manychatData, manychatInput, subscriberId, tagIdDropdown } from '../common/props';
import { manychatOutputSchemas } from '../common/output-schemas';

export const removeTagFromUserAction = createAction({
	auth: manychatAuth,
	name: 'removeTagFromUser',
	classification: 'WRITE',
	displayName: 'Remove Tag from User',
	description: 'Removes a tag from a user and returns the updated user.',
	audience: 'both',
	aiMetadata: {
		description:
			'Removes a tag from a ManyChat subscriber by subscriber ID and tag ID, then returns the updated subscriber. Use to unlabel or de-segment a known contact; get tag IDs from "List Tags". If the subscriber already lacks the tag, ManyChat refuses the removal; the action then re-reads the subscriber and succeeds, so repeating it is safe.',
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
		try {
			await manychatClient.request({
				apiKey,
				method: 'POST',
				path: '/subscriber/removeTag',
				operation: 'remove tag from subscriber',
				body: { subscriber_id: manychatInput.apiId(id), tag_id: propsValue.tagId },
			});
		} catch (error) {
			if (!(error instanceof ManychatApiError) || error.status !== 400) {
				throw error;
			}
			const subscriber = await manychatData.getSubscriber({ apiKey, subscriberId: id });
			if (hasTag({ subscriber, tagId: propsValue.tagId })) {
				throw error;
			}
			return subscriber;
		}
		return manychatData.getSubscriber({ apiKey, subscriberId: id });
	},
});

function hasTag({ subscriber, tagId }: { subscriber: Record<string, unknown>; tagId: unknown }): boolean {
	return manychatUtils.recordsOf(subscriber['tags']).some((tag) => String(tag['id']) === String(tagId));
}
