import { createAction, Property } from '@activepieces/pieces-framework';
import { teamworkAuth } from '../common/auth';
import { teamworkRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const createMilestone = createAction({
	name: 'create_milestone',
	displayName: 'Create Milestone',
	description: 'Create a milestone in a project',
	auth: teamworkAuth,
	props: {
		projectId: Property.ShortText({ displayName: 'Project ID', required: true }),
		title: Property.ShortText({ displayName: 'Title', required: true }),
		dueDate: Property.ShortText({ displayName: 'Due Date (YYYYMMDD)', required: true }),
		responsiblePartyId: Property.ShortText({ displayName: 'Responsible Person ID', required: false }),
	},
	async run({ auth, propsValue }) {
		const body = { milestone: { title: propsValue.title, deadline: propsValue.dueDate, responsiblePartyId: propsValue.responsiblePartyId } };
		return await teamworkRequest(auth, { method: HttpMethod.POST, path: `/projects/${propsValue.projectId}/milestones.json`, body });
	},
});


