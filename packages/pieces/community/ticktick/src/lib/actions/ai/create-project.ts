import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ticktickAuth } from '../../auth';
import { tickTickApiCall } from '../../common/client';
import { TICKTICK_PROJECT_KIND_OPTIONS, TICKTICK_VIEW_MODE_OPTIONS } from '../../common/constants';
import { ticktickCreateProjectOutputSchema } from '../../output-schemas';

export const createProjectAction = createAction({
	auth: ticktickAuth,
	name: 'ticktick_create_project',
	outputSchema: ticktickCreateProjectOutputSchema,
	displayName: 'Create Project',
	description: 'Creates a new TickTick project (list).',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Creates a project and returns it with its new id. Not idempotent: calling twice creates two projects, so check ticktick_list_projects first when unsure. Use viewMode "kanban" if you plan to add columns.',
		idempotent: false,
	},
	props: {
		name: Property.ShortText({
			displayName: 'Name',
			description: 'The project name.',
			required: true,
		}),
		color: Property.ShortText({
			displayName: 'Color',
			description: 'Hex color, for example "#F18181".',
			required: false,
		}),
		sortOrder: Property.Number({
			displayName: 'Sort Order',
			description: 'Sort order value of the project.',
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
		const { name, color, sortOrder, viewMode, kind } = context.propsValue;
		return await tickTickApiCall({
			accessToken: context.auth.access_token,
			method: HttpMethod.POST,
			resourceUri: '/project',
			body: {
				name,
				...(color !== undefined ? { color } : {}),
				...(sortOrder !== undefined ? { sortOrder } : {}),
				...(viewMode !== undefined ? { viewMode } : {}),
				...(kind !== undefined ? { kind } : {}),
			},
		});
	},
});
