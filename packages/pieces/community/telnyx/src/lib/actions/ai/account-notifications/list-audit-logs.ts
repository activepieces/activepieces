import { createAction, Property } from '@activepieces/pieces-framework';

import { telnyxAuth } from '../../../auth';
import { telnyxAiProps } from '../../../common/ai-props';
import { telnyxApi } from '../../../common/api';
import { telnyxUtils } from '../../../common/utils';

export const telnyxListAuditLogsAction = createAction({
	auth: telnyxAuth,
	name: 'telnyx_list_audit_logs',
	displayName: 'List Audit Logs',
	description: 'Lists account audit log entries.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists one page of account audit log entries: who changed which resource, the change type and the changed fields. Filter by creation time and sort by date.',
		idempotent: true,
	},
	props: {
		createdAfter: Property.ShortText({
			displayName: 'Created After',
			description: 'Only entries created after this ISO 8601 time, e.g. "2026-01-01T00:00:00Z".',
			required: false,
		}),
		createdBefore: Property.ShortText({
			displayName: 'Created Before',
			description: 'Only entries created before this ISO 8601 time.',
			required: false,
		}),
		sort: Property.StaticDropdown({
			displayName: 'Sort',
			description: 'Sort by creation date. Defaults to descending.',
			required: false,
			options: {
				disabled: false,
				options: [
					{ label: 'Newest first', value: 'desc' },
					{ label: 'Oldest first', value: 'asc' },
				],
			},
		}),
		pageNumber: telnyxAiProps.pageNumber({ required: false }),
		pageSize: telnyxAiProps.pageSize({ required: false }),
	},
	async run(context) {
		const p = context.propsValue;
		return await telnyxApi.listAuditEvents({
			auth: context.auth,
			query: {
				...telnyxUtils.filterQuery({
					filters: { created_after: p.createdAfter, created_before: p.createdBefore },
				}),
				...telnyxUtils.toQuery({ values: { sort: p.sort } }),
				...telnyxUtils.pageQuery({ pageNumber: p.pageNumber, pageSize: p.pageSize }),
			},
		});
	},
});
