import { createAction, Property, PiecePropValueSchema } from '@activepieces/pieces-framework';
import { teamworkAuth } from '../common/auth';
import { teamworkRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const createStage = createAction({
	name: 'create_stage',
	displayName: 'Create Stage',
	description: 'Add a new stage in a workflow or board.',
	audience: 'both',
	aiMetadata: { description: 'Creates a new stage (column) in a Teamwork board/workflow identified by workflow ID, with a name and optional color. Use when building out or extending a board pipeline; requires the target workflow ID and a stage name. Not idempotent: each call adds another stage.', idempotent: false },
	auth: teamworkAuth,
	props: {
		workflowId: Property.Dropdown({
auth: teamworkAuth,
			displayName: 'Workflow',
			description: 'The workflow to add the stage to.',
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
				const res = await teamworkRequest(auth, {
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
			description: 'The name of the stage.',
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


