import { intercomAuth } from '../../index';
import { createAction, Property } from '@activepieces/pieces-framework';
import { conversationIdProp, tagIdProp } from '../common/props';
import { intercomClient } from '../common';

export const addOrRemoveTagOnConversationAction = createAction({
	auth: intercomAuth,
	name: 'add-or-remove-tag-on-conversation',
	displayName: 'Add/Remove Tag on Conversation',
	description: 'Attach or remove a tag from a specific conversation.',
	props: {
		conversationId: conversationIdProp('Conversation ID', true),
		tagId: tagIdProp('Tag', true),
		untag: Property.Checkbox({
			displayName: 'Untag ?',
			required: false,
			defaultValue: false,
		}),
	},
	async run(context) {
		const client = intercomClient(context.auth);

		const admin = await client.admins.identify();
		const adminId = admin.id;
		if (context.propsValue.untag) {
			const response = await client.tags.untagConversation({
				conversation_id: context.propsValue.conversationId!,
				tag_id: context.propsValue.tagId!,
				admin_id: adminId,
			});

			return response;
		}

		const response = await client.tags.tagConversation({
			conversation_id: context.propsValue.conversationId!,
			id: context.propsValue.tagId!,
			admin_id: adminId,
		});

		return response;
	},
});
