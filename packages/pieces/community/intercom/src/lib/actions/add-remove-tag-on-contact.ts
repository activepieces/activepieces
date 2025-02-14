import { intercomAuth } from '../../index';
import { createAction, Property } from '@activepieces/pieces-framework';
import { contactIdProp, tagIdProp } from '../common/props';
import { intercomClient } from '../common';

export const addOrRemoveTagOnContactAction = createAction({
	auth: intercomAuth,
	name: 'add-or-remove-tag-on-contact',
	displayName: 'Add/Remove Tag on Contact',
	description: 'Attach or remove a tag from a specific contact.',
	props: {
		contactId: contactIdProp('Contact ID','user', true),
		tagId: tagIdProp('Tag Name', true),
		untag: Property.Checkbox({
			displayName: 'Untag ?',
			required: false,
			defaultValue: false,
		}),
	},
	async run(context) {
		const client = intercomClient(context.auth);

		if (context.propsValue.untag) {
			const response = await client.tags.untagContact({
				contact_id: context.propsValue.contactId!,
				tag_id: context.propsValue.tagId!,
			});

			return response;
		}

		const response = await client.tags.tagContact({
			contact_id: context.propsValue.contactId!,
			id: context.propsValue.tagId!,
		});

		return response;
	},
});
