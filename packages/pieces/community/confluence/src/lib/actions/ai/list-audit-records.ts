import { createAction, Property } from '@activepieces/pieces-framework';

import { confluenceAuth } from '../../auth';
import { confluenceApi } from '../../common/api';
import { confluenceListAuditRecordsOutputSchema } from '../../output-schemas';

export const listAuditRecordsAction = createAction({
	auth: confluenceAuth,
	name: 'confluence_list_audit_records',
	outputSchema: confluenceListAuditRecordsOutputSchema,
	displayName: 'List Audit Records',
	description: 'Lists site audit records, optionally by date range or text.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists Confluence audit log records (who changed what, and when), optionally within a date range or matching a search string. Needs Confluence admin and a paid plan. Page with Start and Limit.',
		idempotent: true,
	},
	props: {
		startDate: Property.ShortText({
			displayName: 'Start Date',
			description:
				'Earliest record, as epoch milliseconds or ISO 8601 (e.g. 2026-01-01T00:00:00Z).',
			required: false,
		}),
		endDate: Property.ShortText({
			displayName: 'End Date',
			description: 'Latest record, as epoch milliseconds or ISO 8601.',
			required: false,
		}),
		searchString: Property.ShortText({
			displayName: 'Search',
			description: 'Only records whose summary, author or affected object contains this text.',
			required: false,
		}),
		start: Property.Number({
			displayName: 'Start',
			description: 'Offset of the first item (0-based). Defaults to 0.',
			required: false,
		}),
		limit: Property.Number({
			displayName: 'Limit',
			description: 'Maximum number of items to return. Defaults to 25.',
			required: false,
		}),
	},
	async run(context) {
		const { startDate, endDate, searchString, start, limit } = context.propsValue;
		return await confluenceApi.listAuditRecords({
			auth: context.auth,
			query: { startDate, endDate, searchString, start, limit: limit ?? 25 },
		});
	},
});
