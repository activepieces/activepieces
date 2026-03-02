import { klaviyoAuth } from '../../auth';
import { Property, createAction } from '@activepieces/pieces-framework';
import { makeClient } from '../../common';

export const createListAction = createAction({
	auth: klaviyoAuth,
	name: 'klaviyo_create_list',
	displayName: 'Create List',
	description: 'Creates a new list in Klaviyo.',
	props: {
		name: Property.ShortText({
			displayName: 'Name',
			required: true,
		}),
	},
	async run(context) {
		const { name } = context.propsValue;
		const client = makeClient(context.auth);
		return await client.createList(name);
	},
});
