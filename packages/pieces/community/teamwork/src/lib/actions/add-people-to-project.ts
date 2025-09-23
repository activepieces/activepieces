import { createAction, Property } from '@activepieces/pieces-framework';
import { teamworkAuth } from '../common/auth';
import { teamworkRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const addPeopleToProject = createAction({
	name: 'add_people_to_project',
	displayName: 'Add People to Project',
	description: 'Add users to a project',
	auth: teamworkAuth,
	props: {
		projectId: Property.ShortText({ displayName: 'Project ID', required: true }),
		personIdsCsv: Property.ShortText({ displayName: 'Person IDs (CSV)', required: true }),
	},
	async run({ auth, propsValue }) {
		const body = { user: { id: propsValue.personIdsCsv } };
		return await teamworkRequest(auth, { method: HttpMethod.POST, path: `/projects/${propsValue.projectId}/people.json`, body });
	},
});


