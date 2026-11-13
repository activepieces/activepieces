import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoDeskAuth } from '../../../auth';
import { zohoDeskAiProps } from '../../../common/ai-props';
import { zohoDeskApi } from '../../../common/api';
import { zohoDeskProps } from '../../../common/props';
import { zohoDeskListDepartmentAgentsOutputSchema } from '../../../output-schemas';

export const zohoDeskListDepartmentAgentsAction = createAction({
	auth: zohoDeskAuth,
	name: 'zoho_desk_list_department_agents',
	outputSchema: zohoDeskListDepartmentAgentsOutputSchema,
	displayName: 'List Department Agents',
	description: 'Lists the agents in a department.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists the agents in one department, optionally filtered by a name or email search.',
		idempotent: true,
	},
	props: {
		orgId: zohoDeskProps.orgId({
			required: true,
			description: 'Zoho Desk organization ID (from List Organizations).',
		}),
		departmentId: zohoDeskAiProps.departmentId({ required: true }),
		searchStr: Property.ShortText({
			displayName: 'Search Text',
			description: 'Text to match in the field chosen by Search Field.',
			required: false,
		}),
		fieldName: Property.StaticDropdown({
			displayName: 'Search Field',
			description: 'Field Search Text matches.',
			required: false,
			options: {
				disabled: false,
				options: [
					{ label: 'name', value: 'name' },
					{ label: 'firstName', value: 'firstName' },
					{ label: 'lastName', value: 'lastName' },
					{ label: 'emailId', value: 'emailId' },
				],
			},
		}),
		status: Property.StaticDropdown({
			displayName: 'Status',
			description: 'Only agents with this status.',
			required: false,
			options: {
				disabled: false,
				options: [
					{ label: 'ACTIVE', value: 'ACTIVE' },
					{ label: 'DISABLED', value: 'DISABLED' },
				],
			},
		}),
		from: zohoDeskAiProps.from({ required: false }),
		limit: zohoDeskAiProps.limit({ required: false }),
	},
	async run(context) {
		const { orgId, departmentId, searchStr, fieldName, status, from, limit } = context.propsValue;
		const agents = await zohoDeskApi.listDepartmentAgents({
			auth: context.auth,
			orgId,
			departmentId,
			searchStr,
			fieldName,
			status,
			from,
			limit,
		});
		return { agents, count: agents.length };
	},
});
