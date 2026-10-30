import { createAction, Property } from '@activepieces/pieces-framework';

import { clockifyAuth } from '../../auth';
import { clockifyAiProps } from '../../common/ai-props';
import { clockifyApi } from '../../common/api';
import { clockifyUtils } from '../../common/utils';
import { projectOutputSchema } from '../../output-schemas';

export const updateProjectAction = createAction({
	auth: clockifyAuth,
	name: 'clockify_update_project',
	outputSchema: projectOutputSchema,
	displayName: 'Update Project',
	description: 'Updates or archives a project.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Updates a project name, client, color, note, billable or public flag, or archives / unarchives it. Only the fields you set change: the action reads the project and sends the rest back unchanged. Archiving is required before Delete Project.',
		idempotent: true,
	},
	props: {
		workspaceId: clockifyAiProps.workspaceId({ required: true }),
		projectId: clockifyAiProps.projectId({ required: true }),
		name: Property.ShortText({ displayName: 'Name', required: false }),
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
		billable: Property.StaticDropdown({
			displayName: 'Billable',
			description: 'Make the project billable (Yes) or not (No). Empty = unchanged.',
			required: false,
			options: {
				disabled: false,
				options: [
					{ label: 'Yes', value: 'true' },
					{ label: 'No', value: 'false' },
				],
			},
		}),
		isPublic: Property.StaticDropdown({
			displayName: 'Public',
			description: 'Make the project public (Yes) or members-only (No). Empty = unchanged.',
			required: false,
			options: {
				disabled: false,
				options: [
					{ label: 'Yes', value: 'true' },
					{ label: 'No', value: 'false' },
				],
			},
		}),
		archived: Property.StaticDropdown({
			displayName: 'Archived',
			description: 'Archive (Yes) or unarchive (No). Empty = unchanged.',
			required: false,
			options: {
				disabled: false,
				options: [
					{ label: 'Yes', value: 'true' },
					{ label: 'No', value: 'false' },
				],
			},
		}),
	},
	async run({ auth, propsValue }) {
		const current = await clockifyApi.getProject({
			auth,
			workspaceId: propsValue.workspaceId,
			projectId: propsValue.projectId,
		});
		return await clockifyApi.updateProject({
			auth,
			workspaceId: propsValue.workspaceId,
			projectId: propsValue.projectId,
			project: {
				name: propsValue.name ?? current.name,
				clientId: propsValue.clientId ?? current.clientId,
				color: propsValue.color ?? current.color,
				note: propsValue.note ?? current.note,
				billable:
					clockifyUtils.toOptionalBoolean({ value: propsValue.billable }) ?? current.billable,
				isPublic: clockifyUtils.toOptionalBoolean({ value: propsValue.isPublic }) ?? current.public,
				archived:
					clockifyUtils.toOptionalBoolean({ value: propsValue.archived }) ?? current.archived,
			},
		});
	},
});
