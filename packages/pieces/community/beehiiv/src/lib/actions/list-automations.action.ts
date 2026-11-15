import { Property, createAction } from '@activepieces/pieces-framework';
import { publicationId } from '../common/props';
import { beehiivAuth } from '../common/auth';
import { apiKeyOf, beehiivClient, pathFor } from '../common/client';
import { isNil } from '@activepieces/pieces-framework';
import { beehiivOutputSchemas } from '../common/output-schemas';

export const listAutomationsAction = createAction({
	auth: beehiivAuth,
	name: 'list_automations',
	classification: 'SEARCH',
	displayName: 'List Automations',
	description:
		'Retrieves the automations of a publication. With Limit and Page empty it returns all of them; otherwise it returns only the requested page.',
	audience: 'both',
	aiMetadata: {
		description:
			'Lists the automations of a beehiiv publication (Publication ID from "List Publications") with their status and trigger events. Agents should set Limit (1-100) and Page: the result is a plain array with no total, so request Page + 1 only while a page returns Limit items. With Limit and Page both empty it returns every automation (fails past 10,000). Only automations whose trigger_events include "api" and whose status is live or running accept subscribers through "Add Subscription to Automation" or the Automation IDs of "Create Subscription (AI)". Read-only.',
		idempotent: true,
	},
	outputSchema: beehiivOutputSchemas.humanListAutomations,
	props: {
		publicationId: publicationId,
		limit: Property.Number({
			displayName: 'Limit',
			description: 'A limit on the number of automations to be returned (1-100, default 10).',
			required: false,
		}),
		page: Property.Number({
			displayName: 'Page',
			description: 'The page number for pagination (default 1).',
			required: false,
		}),
	},
	async run(context) {
		const { publicationId, page, limit } = context.propsValue;
		const apiKey = apiKeyOf(context.auth);
		const path = `${pathFor(['publications', publicationId])}/automations`;

		if (isNil(page) && isNil(limit)) {
			return beehiivClient.listAllPaged<Record<string, unknown>>({
				apiKey,
				path,
				operation: 'list automations',
				maxItems: MAX_ITEMS,
			});
		}

		const response = await beehiivClient.request({
			apiKey,
			method: 'GET',
			path,
			operation: 'list automations',
			query: { page: isNil(page) ? undefined : page, limit: isNil(limit) ? undefined : limit },
		});
		return dataArray(response.body);
	},
});

function dataArray(body: unknown): unknown[] {
	if (body !== null && typeof body === 'object' && 'data' in body && Array.isArray(body.data)) {
		return body.data;
	}
	return [];
}

const MAX_ITEMS = 10_000;
