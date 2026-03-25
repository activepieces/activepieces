import { createAction, Property } from '@activepieces/pieces-framework';
import { zohoDeskApiCall } from '../common';
import { zohoDeskAuth } from '../common/auth';
import { organizationId } from '../common/props';
import { HttpMethod } from '@activepieces/pieces-common';
import { isNil } from '@activepieces/shared';

export const findContactAction = createAction({
	auth: zohoDeskAuth,
	name: 'find-contact',
	displayName: 'Find Contact',
	description: 'Finds an existing contact by email.',
	props: {
		orgId: organizationId({ displayName: 'Organization', required: true }),
		email: Property.ShortText({
			displayName: 'Email',
			required: true,
		}),
	},
	async run(context) {
		const response = await zohoDeskApiCall({
			auth: context.auth,
			method: HttpMethod.GET,
			resourceUri: '/contacts/search',
			orgId: context.propsValue.orgId,
			query: {
				email: context.propsValue.email,
			},
		});

		if (isNil(response) || response === '') {
			return {
				found: false,
				result: [],
			};
		}

		const contacts = response as { data: Record<string, any>[] };

		return {
			found: contacts.data.length > 0,
			result: contacts.data,
		};
	},
});
