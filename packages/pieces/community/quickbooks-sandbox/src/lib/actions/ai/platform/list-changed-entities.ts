import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { quickbooksAuth } from '../../../auth';
import { quickbooksAiProps } from '../../../common/ai-props';
import { quickbooksClient } from '../../../common/client';
import { quickbooksSandboxListChangedEntitiesOutputSchema } from '../../../output-schemas';

export const listChangedEntitiesAction = createAction({
	auth: quickbooksAuth,
	name: 'quickbooks_sandbox_list_changed_entities',
	outputSchema: quickbooksSandboxListChangedEntitiesOutputSchema,
	displayName: 'List Changed Entities',
	description: 'Lists records of the given entity types changed since a time.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists every record of the given entity types created, changed or deleted since a time (change data capture); deleted records come back with status "Deleted". The time must be within the last 30 days, and each entity type returns at most 1000 records. Use Run Query for older changes.',
		idempotent: true,
	},
	props: {
		entities: Property.ShortText({
			displayName: 'Entities',
			description: 'Comma-separated QuickBooks entity names, e.g. "Invoice,Customer,Payment".',
			required: true,
		}),
		changedSince: quickbooksAiProps.date({
			required: true,
			displayName: 'Changed Since',
			description: 'ISO 8601 date-time to look back to, within the last 30 days, e.g. 2025-01-15T09:00:00-08:00.',
		}),
	},
	async run(context) {
		const { entities, changedSince } = context.propsValue;
		return await quickbooksClient.request<Record<string, unknown>>({
			auth: context.auth,
			method: HttpMethod.GET,
			path: '/cdc',
			query: { entities, changedSince },
		});
	},
});
