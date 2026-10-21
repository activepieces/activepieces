import { createAction, Property } from '@activepieces/pieces-framework';

import { clockifyAuth } from '../../auth';
import { clockifyAiProps } from '../../common/ai-props';
import { clockifyApi } from '../../common/api';
import { projectOutputSchema } from '../../output-schemas';

export const createProjectAction = createAction({
	auth: clockifyAuth,
	name: 'clockify_create_project',
	outputSchema: projectOutputSchema,
	displayName: 'Create Project',
	description: 'Creates a project in a workspace.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Creates a project in a Clockify workspace, optionally for a client, and returns it with its ID. Not idempotent: project names must be unique per client, so a repeat fails.',
		idempotent: false,
	},
	props: {
		workspaceId: clockifyAiProps.workspaceId({ required: true }),
		name: Property.ShortText({ displayName: 'Name', required: true }),
		clientId: clockifyAiProps.clientId({
			required: false,
			description: 'Optional client ID. Use List Clients to find it.',
		}),
		color: Property.ShortText({
			displayName: 'Color',
			description: 'Hex color, for example #03A9F4.',
			required: false,
		}),
		note: Property.LongText({ displayName: 'Note', required: false }),
		billable: Property.Checkbox({
			displayName: 'Billable',
			description: 'Time on this project is billable by default. Default false.',
			required: false,
		}),
		isPublic: Property.Checkbox({
			displayName: 'Public',
			description: 'Every workspace member can track time on it. Default false (only members).',
			required: false,
		}),
		billableRate: Property.Number({
			displayName: 'Billable Rate',
			description: 'Optional project billable rate in cents, for example 5000 for 50.00.',
			required: false,
		}),
	},
	async run({ auth, propsValue }) {
		return await clockifyApi.createProject({
			auth,
			workspaceId: propsValue.workspaceId,
			project: {
				name: propsValue.name,
				clientId: propsValue.clientId,
				color: propsValue.color,
				note: propsValue.note,
				billable: propsValue.billable,
				isPublic: propsValue.isPublic,
				hourlyRate:
					propsValue.billableRate === undefined ? undefined : { amount: propsValue.billableRate },
			},
		});
	},
});
