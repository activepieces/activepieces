import { createAction, Property } from '@activepieces/pieces-framework';
import { teamworkAuth } from '../common/auth';
import { HttpMethod } from '@activepieces/pieces-common';
import { teamworkRequest } from '../common/client';

export const createProject = createAction({
	name: 'create_project',
	displayName: 'Create Project',
	description: 'Create a new project in Teamwork',
	auth: teamworkAuth,
	props: {
		name: Property.ShortText({ displayName: 'Name', required: true }),
		description: Property.LongText({ displayName: 'Description', required: false }),
		companyId: Property.ShortText({ displayName: 'Company ID', required: false }),
		startDate: Property.ShortText({ displayName: 'Start Date (YYYYMMDD)', required: false }),
		endDate: Property.ShortText({ displayName: 'End Date (YYYYMMDD)', required: false }),
	},
	async run({ auth, propsValue }) {
		const body = {
			project: {
				name: propsValue.name,
				description: propsValue.description,
				companyId: propsValue.companyId,
				startDate: propsValue.startDate,
				endDate: propsValue.endDate,
			},
		};
		return await teamworkRequest(auth, {
			method: HttpMethod.POST,
			path: `/projects.json`,
			body,
		});
	},
});


