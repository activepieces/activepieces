import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { jiraCloudAuth } from '../../../auth';
import { jiraApiCall } from '../../common';
import { JiraRecord, jiraAiHelpers } from '../../common/ai-helpers';

import { permittedProjectsOutputSchema } from '../../output-schemas';
export const getPermittedProjectsAiAction = createAction({
	auth: jiraCloudAuth,
	name: 'get_permitted_projects',
	classification: 'SEARCH',
	displayName: 'Get Permitted Projects',
	description: 'Lists the projects where the user has all given permissions.',
	audience: 'ai',
	aiMetadata: {
		description:
			'List the projects in which the connected user holds every one of the given project permissions, e.g. the projects where they can create issues. Returns project IDs and keys only; use Get Project for details. Read-only.',
		idempotent: true,
	},
	outputSchema: permittedProjectsOutputSchema,
	props: {
		permissions: Property.Array({
			displayName: 'Permission Keys',
			description: 'Project permission keys that must all be held, e.g. CREATE_ISSUES, EDIT_ISSUES, TRANSITION_ISSUES.',
			required: true,
		}),
	},
	async run({ auth, propsValue }) {
		const permissions = jiraAiHelpers.toStringList({ value: propsValue.permissions });
		if (permissions.length === 0) {
			throw new Error('Provide at least one permission key.');
		}
		const response = await jiraApiCall<{ projects?: JiraRecord[] }>({
			auth,
			method: HttpMethod.POST,
			resourceUri: '/permissions/project',
			body: { permissions },
		});
		return jiraAiHelpers.toList({ items: response.projects ?? [] });
	},
});
