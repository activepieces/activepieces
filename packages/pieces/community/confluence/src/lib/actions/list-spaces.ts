import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { confluenceAuth } from '../auth';
import { confluencePaginatedApiCall } from '../common';

export const listSpacesAction = createAction({
	auth: confluenceAuth,
	name: 'list-spaces',
	displayName: 'List Spaces',
	description: 'Lists all spaces the authenticated user can access.',
	props: {
		type: Property.StaticDropdown({
			displayName: 'Type',
			required: false,
			options: {
				disabled: false,
				options: [
					{ label: 'Global', value: 'global' },
					{ label: 'Personal', value: 'personal' },
					{ label: 'Collaboration', value: 'collaboration' },
					{ label: 'Knowledge Base', value: 'knowledge_base' },
				],
			},
		}),
		status: Property.StaticDropdown({
			displayName: 'Status',
			required: false,
			defaultValue: 'current',
			options: {
				disabled: false,
				options: [
					{ label: 'Current', value: 'current' },
					{ label: 'Archived', value: 'archived' },
				],
			},
		}),
	},
	async run(context) {
		const { type, status } = context.propsValue;

		const query: Record<string, string> = {};
		if (type) query['type'] = type;
		if (status) query['status'] = status;

		const spaces = await confluencePaginatedApiCall<Record<string, unknown>>({
			domain: context.auth.props.confluenceDomain,
			username: context.auth.props.username,
			password: context.auth.props.password,
			method: HttpMethod.GET,
			version: 'v2',
			resourceUri: '/spaces',
			query,
		});

		return { count: spaces.length, results: spaces };
	},
});
