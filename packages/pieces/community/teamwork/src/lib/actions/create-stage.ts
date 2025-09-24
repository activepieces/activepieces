import { createAction, Property, OAuth2PropertyValue } from '@activepieces/pieces-framework';
import { teamworkAuth } from '../common/auth';
import { teamworkRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const createStage = createAction({
	name: 'create_stage',
	displayName: 'Create Stage',
	description: 'Add a new stage in a workflow or board.',
	auth: teamworkAuth,
	props: {
		workflowId: Property.Dropdown({
			displayName: 'Workflow',
			required: true,
			refreshers: [],
			options: async ({ auth }) => {
				if (!auth) {
					return {
						disabled: true,
						placeholder: 'Please authenticate first.',
						options: [],
					};
				}
				const res = await teamworkRequest(auth as OAuth2PropertyValue, {
					method: HttpMethod.GET,
					path: '/projects/api/v3/workflows.json',
				});
				const options = res.data.workflows.map((w: { id: string; name: string }) => ({
					label: w.name,
					value: w.id,
				}));
				return {
					disabled: false,
					options,
				};
			},
		}),
		name: Property.ShortText({
			displayName: 'Name',
			required: true,
		}),
		color: Property.ShortText({
			displayName: 'Color',
			description: 'Hex color code (e.g., #FF0000)',
			required: false,
		}),
	},
	async run({ auth, propsValue }) {
		const body = {
			stage: {
				name: propsValue.name,
				color: propsValue.color
					? {
							Value: propsValue.color,
					  }
					: undefined,
			},
		};
		return await teamworkRequest(auth, {
			method: HttpMethod.POST,
			path: `/projects/api/v3/workflows/${propsValue.workflowId}/stages.json`,
			body,
		});
	},
});


