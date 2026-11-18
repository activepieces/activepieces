import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoDeskAuth } from '../../../auth';
import { zohoDeskAiProps } from '../../../common/ai-props';
import { zohoDeskApi } from '../../../common/api';
import { zohoDeskProps } from '../../../common/props';
import { zohoDeskUtils } from '../../../common/utils';
import { zohoDeskListAgentsOutputSchema } from '../../../output-schemas';

export const zohoDeskListAgentsAction = createAction({
	auth: zohoDeskAuth,
	name: 'zoho_desk_list_agents',
	outputSchema: zohoDeskListAgentsOutputSchema,
	displayName: 'List Agents',
	description: 'Lists agents.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists agents, optionally by department, role, status or a name/email search. Agent `id` values feed assignee, owner and follower inputs. Page with From and Limit.',
		idempotent: true,
	},
	props: {
		orgId: zohoDeskProps.orgId({
			required: true,
			description: 'Zoho Desk organization ID (from List Organizations).',
		}),
		searchStr: Property.ShortText({
			displayName: 'Search Text',
			description: 'Text to match in the field chosen by Search Field.',
			required: false,
		}),
		fieldName: Property.StaticDropdown({
			displayName: 'Search Field',
			description: 'Field Search Text matches. Defaults to name.',
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
		departmentIds: Property.Array({
			displayName: 'Department IDs',
			description: 'Only agents in these departments.',
			required: false,
		}),
		roleIds: Property.Array({
			displayName: 'Role IDs',
			description: 'Only agents with these roles (from List Roles).',
			required: false,
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
					{ label: 'DELETED', value: 'DELETED' },
					{ label: 'IMPORTED', value: 'IMPORTED' },
				],
			},
		}),
		isConfirmed: zohoDeskAiProps.yesNo({
			required: false,
			displayName: 'Is Confirmed',
			description: 'Yes returns only agents who accepted their invitation.',
		}),
		isLightAgent: zohoDeskAiProps.yesNo({
			required: false,
			displayName: 'Is Light Agent',
			description: 'Yes returns only light agents, No only full agents.',
		}),
		from: zohoDeskAiProps.from({ required: false }),
		limit: zohoDeskAiProps.limit({ required: false }),
	},
	async run(context) {
		const {
			orgId,
			searchStr,
			fieldName,
			departmentIds,
			roleIds,
			status,
			isConfirmed,
			isLightAgent,
			from,
			limit,
		} = context.propsValue;
		const agents = await zohoDeskApi.listAgents({
			auth: context.auth,
			orgId,
			searchStr,
			fieldName,
			departmentIds: zohoDeskUtils.optionalStringList({
				value: departmentIds,
				propName: 'Department IDs',
			}),
			roleIds: zohoDeskUtils.optionalStringList({ value: roleIds, propName: 'Role IDs' }),
			status,
			isConfirmed,
			isLightAgent,
			from,
			limit,
		});
		return { agents, count: agents.length };
	},
});
