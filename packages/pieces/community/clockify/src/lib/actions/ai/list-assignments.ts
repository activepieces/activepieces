import { createAction, Property } from '@activepieces/pieces-framework';

import { clockifyAuth } from '../../auth';
import { clockifyAiProps } from '../../common/ai-props';
import { clockifyApi } from '../../common/api';
import { clockifyUtils } from '../../common/utils';
import { assignmentsOutputSchema } from '../../output-schemas';

export const listAssignmentsAction = createAction({
	auth: clockifyAuth,
	name: 'clockify_list_assignments',
	outputSchema: assignmentsOutputSchema,
	displayName: 'List Assignments',
	description: 'Lists scheduled assignments in a period.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists scheduled assignments (who is planned on which project, hours per day) in a period across the workspace, optionally filtered by name. Needs a Clockify plan with scheduling (Pro or higher). Returns one page.',
		idempotent: true,
	},
	props: {
		workspaceId: clockifyAiProps.workspaceId({ required: true }),
		start: Property.DateTime({
			displayName: 'From',
			description: 'Start of the period, ISO 8601.',
			required: true,
		}),
		end: Property.DateTime({
			displayName: 'To',
			description: 'End of the period, ISO 8601.',
			required: true,
		}),
		name: Property.ShortText({
			displayName: 'Name',
			description: 'Optional: only assignments whose project or user name contains this text.',
			required: false,
		}),
		page: clockifyAiProps.page({ required: false }),
		pageSize: clockifyAiProps.pageSize({ required: false }),
	},
	async run({ auth, propsValue }) {
		const assignments = await clockifyApi.listAssignments({
			auth,
			workspaceId: propsValue.workspaceId,
			query: clockifyUtils.toQuery({
				params: {
					start: propsValue.start,
					end: propsValue.end,
					name: propsValue.name,
					page: propsValue.page ?? 1,
					'page-size': propsValue.pageSize ?? 50,
				},
			}),
		});
		return { assignments, count: assignments.length };
	},
});
