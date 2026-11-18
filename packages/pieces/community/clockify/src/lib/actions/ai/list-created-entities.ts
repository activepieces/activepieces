import { createAction, Property } from '@activepieces/pieces-framework';

import { clockifyAuth } from '../../auth';
import { clockifyAiProps } from '../../common/ai-props';
import { clockifyApi } from '../../common/api';
import { clockifyUtils } from '../../common/utils';
import { createdEntitiesOutputSchema } from '../../output-schemas';

export const listCreatedEntitiesAction = createAction({
	auth: clockifyAuth,
	name: 'clockify_list_created_entities',
	outputSchema: createdEntitiesOutputSchema,
	displayName: 'List Created Entities',
	description: 'Lists records of one type created in a period.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists records of one type (for example TIME_ENTRY or PROJECTS) created in a workspace within a period: a change feed for syncing Clockify to another system. Set From and To to the period you need; without them Clockify only looks at a short recent window. Experimental Clockify endpoint. Returns one page.',
		idempotent: true,
	},
	props: {
		workspaceId: clockifyAiProps.workspaceId({ required: true }),
		entityType: clockifyAiProps.changeFeedEntityType({ required: true }),
		start: Property.DateTime({
			displayName: 'From',
			description: 'Optional start of the period, ISO 8601.',
			required: false,
		}),
		end: Property.DateTime({
			displayName: 'To',
			description: 'Optional end of the period, ISO 8601.',
			required: false,
		}),
		page: clockifyAiProps.page({ required: false }),
		limit: Property.Number({
			displayName: 'Limit',
			description: 'Items per page. Default 50.',
			required: false,
		}),
	},
	async run({ auth, propsValue }) {
		return await clockifyApi.listCreatedEntities({
			auth,
			workspaceId: propsValue.workspaceId,
			query: clockifyUtils.toQuery({
				params: {
					type: propsValue.entityType,
					start: propsValue.start,
					end: propsValue.end,
					page: propsValue.page ?? 1,
					limit: propsValue.limit ?? 50,
				},
			}),
		});
	},
});
