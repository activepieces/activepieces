import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ticktickAuth } from '../../auth';
import { tickTickApiCall } from '../../common/client';
import { TICKTICK_PROJECT_KIND_OPTIONS, TICKTICK_VIEW_MODE_OPTIONS } from '../../common/constants';
import { ticktickCreateProjectOutputSchema } from '../../output-schemas';

export const updateProjectAction = createAction({
	auth: ticktickAuth,
	name: 'ticktick_update_project',
	outputSchema: ticktickCreateProjectOutputSchema,
	displayName: 'Update Project',
	description: 'Updates the name, color, order, view mode or kind of a TickTick project.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Changes only the fields you supply on a project by projectId from ticktick_list_projects; omitted fields keep their value. Sets state, so repeating it is safe.',
		idempotent: true,
	},
	props: {
		projectId: Property.ShortText({
			displayName: 'Project ID',
			description: 'The project ID, from the List Projects action.',
			required: true,
		}),
		name: Property.ShortText({
			displayName: 'Name',
			required: false,
		}),
		color: Property.ShortText({
			displayName: 'Color',
			description: 'Hex color, for example "#F18181".',
			required: false,
		}),
		sortOrder: Property.Number({
			displayName: 'Sort Order',
			required: false,
		}),
		viewMode: Property.StaticDropdown({
			displayName: 'View Mode',
			required: false,
			options: TICKTICK_VIEW_MODE_OPTIONS,
		}),
		kind: Property.StaticDropdown({
			displayName: 'Kind',
			required: false,
			options: TICKTICK_PROJECT_KIND_OPTIONS,
		}),
	},
	async run(context) {
		const { projectId, name, color, sortOrder, viewMode, kind } = context.propsValue;
		return await tickTickApiCall({
			accessToken: context.auth.access_token,
			method: HttpMethod.POST,
			resourceUri: `/project/${projectId}`,
			body: {
				...(name !== undefined ? { name } : {}),
				...(color !== undefined ? { color } : {}),
				...(sortOrder !== undefined ? { sortOrder } : {}),
				...(viewMode !== undefined ? { viewMode } : {}),
				...(kind !== undefined ? { kind } : {}),
			},
		});
	},
});
