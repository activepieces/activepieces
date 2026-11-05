import { createAction, Property } from '@activepieces/pieces-framework';

import { telnyxAuth } from '../../../auth';
import { telnyxAiProps } from '../../../common/ai-props';
import { telnyxApi } from '../../../common/api';
import { telnyxUtils } from '../../../common/utils';

export const telnyxListConferencesAction = createAction({
	auth: telnyxAuth,
	name: 'telnyx_list_conferences',
	displayName: 'List Conferences',
	description: 'Lists conferences on the account.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists one page of conferences with their id, name, status and region. Filter by name or status. Use the returned id with the other conference actions.',
		idempotent: true,
	},
	props: {
		name: Property.ShortText({
			displayName: 'Name',
			description: 'Only return conferences with this exact name.',
			required: false,
		}),
		status: Property.StaticDropdown({
			displayName: 'Status',
			description: 'Only return conferences in this status.',
			required: false,
			options: {
				disabled: false,
				options: [
					{ label: 'Init', value: 'init' },
					{ label: 'In Progress', value: 'in_progress' },
					{ label: 'Completed', value: 'completed' },
				],
			},
		}),
		pageNumber: telnyxAiProps.pageNumber({ required: false }),
		pageSize: telnyxAiProps.pageSize({ required: false }),
	},
	async run(context) {
		const p = context.propsValue;
		return await telnyxApi.listConferences({
			auth: context.auth,
			query: {
				...telnyxUtils.filterQuery({ filters: { name: p.name, status: p.status } }),
				...telnyxUtils.pageQuery({ pageNumber: p.pageNumber, pageSize: p.pageSize }),
			},
		});
	},
});
