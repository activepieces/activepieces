import { klaviyoAuth } from '../../auth';
import { Property, createAction } from '@activepieces/pieces-framework';
import { klaviyoCommon, makeClient } from '../../common';

export const removeProfileFromListAction = createAction({
	auth: klaviyoAuth,
	name: 'klaviyo_remove_profile_from_list',
	displayName: 'Remove Profile from List',
	description: 'Removes a profile from a specific list in Klaviyo.',
	props: {
		listId: klaviyoCommon.listId(true),
		profileId: Property.ShortText({
			displayName: 'Profile ID',
			required: true,
			description: 'The unique ID of the profile to remove from the list.',
		}),
	},
	async run(context) {
		const { listId, profileId } = context.propsValue;
		const client = makeClient(context.auth);
		return await client.removeProfileFromList(listId as string, profileId);
	},
});
