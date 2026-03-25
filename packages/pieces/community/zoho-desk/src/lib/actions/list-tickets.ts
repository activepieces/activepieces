import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { zohoDeskAuth } from '../common/auth';
import { zohoDeskApiCall } from '../common';
import { organizationId } from '../common/props';

export const listTicketsAction = createAction({
	auth: zohoDeskAuth,
	name: 'list_tickets',
	description: 'List tickets',
	displayName: 'List tickets.',
	props: {
		orgId: organizationId({ displayName: 'Organization', required: true }),
		include: Property.StaticMultiSelectDropdown({
			displayName: 'include',
			required: false,
			description: 'Additional information related to the tickets.',
			options: {
				disabled: false,
				options: [
					{ label: 'contacts', value: 'contacts' },
					{ label: 'products', value: 'products' },
					{ label: 'departments', value: 'departments' },
					{ label: 'team', value: 'team' },
					{ label: 'isRead', value: 'isRead' },
					{ label: 'assignee', value: 'assignee' },
				],
			},
		}),
	},
	async run({ propsValue, auth }) {
		const queryParams: Record<string, string> = {};

		if (propsValue.include) queryParams['include'] = propsValue.include.join(',');

		const response = await zohoDeskApiCall({
			auth,
			method: HttpMethod.GET,
			resourceUri: '/tickets',
			orgId: propsValue.orgId,
			query: queryParams,
		});

		return response;
	},
});
