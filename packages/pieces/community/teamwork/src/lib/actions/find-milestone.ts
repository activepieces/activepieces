import { createAction, Property } from '@activepieces/pieces-framework';
import { teamworkAuth } from '../common/auth';
import { teamworkRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const findMilestone = createAction({
	name: 'find_milestone',
	displayName: 'Find Milestone',
	description: 'Search milestones by title',
	auth: teamworkAuth,
	props: {
		projectId: Property.ShortText({ displayName: 'Project ID', required: true }),
		title: Property.ShortText({ displayName: 'Title contains', required: true }),
	},
	async run({ auth, propsValue }) {
		return await teamworkRequest(auth, { method: HttpMethod.GET, path: `/projects/${propsValue.projectId}/milestones.json`, query: { searchTerm: propsValue.title } as any });
	},
});


