import { createAction, Property } from '@activepieces/pieces-framework';

import { clockifyAuth } from '../../auth';
import { clockifyAiProps } from '../../common/ai-props';
import { clockifyApi } from '../../common/api';
import { clockifyUtils } from '../../common/utils';
import { projectsOutputSchema } from '../../output-schemas';

export const listProjectsAction = createAction({
	auth: clockifyAuth,
	name: 'clockify_list_projects',
	outputSchema: projectsOutputSchema,
	displayName: 'List Projects',
	description: 'Lists or searches the projects of a workspace.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists the projects of a Clockify workspace, optionally filtered by name, client, billable, archived or template state. Use it to find a project ID. Returns one page.',
		idempotent: true,
	},
	props: {
		workspaceId: clockifyAiProps.workspaceId({ required: true }),
		name: Property.ShortText({
			displayName: 'Name',
			description: 'Optional: only projects whose name contains this text.',
			required: false,
		}),
		exactMatch: Property.Checkbox({
			displayName: 'Exact Name Match',
			description: 'Match Name exactly instead of contains. Default false.',
			required: false,
		}),
		clientId: clockifyAiProps.clientId({
			required: false,
			description: 'Optional: only projects of this client. Use List Clients to find it.',
		}),
		archived: Property.StaticDropdown({
			displayName: 'Archived',
			description: 'Optional: only archived (Yes) or only active (No) projects. Empty = both.',
			required: false,
			options: {
				disabled: false,
				options: [
					{ label: 'Yes', value: 'true' },
					{ label: 'No', value: 'false' },
				],
			},
		}),
		billable: Property.StaticDropdown({
			displayName: 'Billable',
			description: 'Optional: only billable (Yes) or non-billable (No) projects. Empty = both.',
			required: false,
			options: {
				disabled: false,
				options: [
					{ label: 'Yes', value: 'true' },
					{ label: 'No', value: 'false' },
				],
			},
		}),
		isTemplate: Property.StaticDropdown({
			displayName: 'Template',
			description: 'Optional: only template (Yes) or regular (No) projects. Empty = both.',
			required: false,
			options: {
				disabled: false,
				options: [
					{ label: 'Yes', value: 'true' },
					{ label: 'No', value: 'false' },
				],
			},
		}),
		page: clockifyAiProps.page({ required: false }),
		pageSize: clockifyAiProps.pageSize({ required: false }),
	},
	async run({ auth, propsValue }) {
		const projects = await clockifyApi.listProjects({
			auth,
			workspaceId: propsValue.workspaceId,
			query: clockifyUtils.toQuery({
				params: {
					name: propsValue.name,
					'strict-name-search': propsValue.exactMatch,
					clients: propsValue.clientId,
					archived: propsValue.archived,
					billable: propsValue.billable,
					'is-template': propsValue.isTemplate,
					page: propsValue.page ?? 1,
					'page-size': propsValue.pageSize ?? 50,
				},
			}),
		});
		return { projects, count: projects.length };
	},
});
