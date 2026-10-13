import { createAction, Property } from '@activepieces/pieces-framework';

import { facebookLeadsAuth } from '../../auth';
import { facebookLeadsAiProps } from '../../common/ai-props';
import { facebookLeadsApi } from '../../common/api';
import { facebookLeadsUtils } from '../../common/utils';
import { facebookLeadsListLeadsOutputSchema } from '../../output-schemas';

const DEFAULT_LIMIT = 25;
const MAX_LIMIT = 100;

export const listLeadsAction = createAction({
	auth: facebookLeadsAuth,
	name: 'facebook_leads_list_leads',
	outputSchema: facebookLeadsListLeadsOutputSchema,
	displayName: 'List Leads',
	description: 'Lists the leads submitted to a lead form.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists one page of leads submitted to a lead form, newest first, each with its answers keyed by question and its ad/campaign context. Filter by submission time with Created After / Created Before, and pass Next Cursor back as Cursor to get the next page. Facebook only returns leads from the last 90 days, and there is no search by email or phone: list and match the answers instead.',
		idempotent: true,
	},
	props: {
		formId: facebookLeadsAiProps.formId({ required: true }),
		createdAfter: Property.DateTime({
			displayName: 'Created After',
			description: 'Only leads submitted after this time (ISO 8601).',
			required: false,
		}),
		createdBefore: Property.DateTime({
			displayName: 'Created Before',
			description: 'Only leads submitted before this time (ISO 8601).',
			required: false,
		}),
		limit: Property.Number({
			displayName: 'Limit',
			description: `Leads per page (1-${MAX_LIMIT}). Defaults to ${DEFAULT_LIMIT}.`,
			required: false,
		}),
		cursor: Property.ShortText({
			displayName: 'Cursor',
			description: 'Next Cursor from a previous List Leads call, to get the next page.',
			required: false,
		}),
	},
	async run(context) {
		const { formId, createdAfter, createdBefore, limit, cursor } = context.propsValue;
		const filters = [
			...(createdAfter
				? [
						{
							field: 'time_created',
							operator: 'GREATER_THAN',
							value: toUnixSeconds({ value: createdAfter }),
						},
				  ]
				: []),
			...(createdBefore
				? [
						{
							field: 'time_created',
							operator: 'LESS_THAN',
							value: toUnixSeconds({ value: createdBefore }),
						},
				  ]
				: []),
		];
		const response = await facebookLeadsApi.listFormLeadsPage({
			formId,
			accessToken: context.auth.access_token,
			limit: Math.min(Math.max(Math.floor(limit ?? DEFAULT_LIMIT), 1), MAX_LIMIT),
			after: cursor,
			filtering: filters.length > 0 ? JSON.stringify(filters) : undefined,
		});
		const leads = response.data.map((lead) => facebookLeadsUtils.transformLeadData({ lead }));
		return {
			leads,
			count: leads.length,
			next_cursor: response.paging?.next ? response.paging.cursors?.after ?? null : null,
		};
	},
});

function toUnixSeconds({ value }: { value: string }): number {
	const time = Date.parse(value);
	if (Number.isNaN(time)) {
		throw new Error(`Invalid date: ${value}`);
	}
	return Math.floor(time / 1000);
}
