import { klaviyoAuth } from '../../auth';
import { Property, createAction } from '@activepieces/pieces-framework';
import { klaviyoCommon, makeClient } from '../../common';

export const addProfileToListAction = createAction({
	auth: klaviyoAuth,
	name: 'klaviyo_add_profile_to_list',
	displayName: 'Add Profile to List',
	description: 'Adds a profile to a specific list in Klaviyo.',
	props: {
		listId: klaviyoCommon.listId(true),
		profileId: Property.ShortText({
			displayName: 'Profile ID',
			required: true,
			description: 'The unique ID of the profile to add to the list.',
		}),
	},
	async run(context) {
		const { listId, profileId } = context.propsValue;
		const client = makeClient(context.auth);
		return await client.addProfileToList(listId as string, profileId);
	},
});
