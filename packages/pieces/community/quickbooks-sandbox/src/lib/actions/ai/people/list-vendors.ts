import { createAction } from '@activepieces/pieces-framework';
import { quickbooksAuth } from '../../../auth';
import { quickbooksAiProps } from '../../../common/ai-props';
import { quickbooksApi } from '../../../common/api';
import { quickbooksSandboxListVendorsOutputSchema } from '../../../output-schemas';

export const listVendorsAiAction = createAction({
	auth: quickbooksAuth,
	name: 'quickbooks_sandbox_list_vendors',
	outputSchema: quickbooksSandboxListVendorsOutputSchema,
	displayName: 'List Vendors',
	description: 'Lists vendors, optionally filtered.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists vendors one page at a time, with an optional QuickBooks query filter (e.g. "DisplayName LIKE \'%Supply%\'" or "PrimaryEmailAddr = \'ap@example.com\'") and sort. Only active vendors are returned unless the filter includes "Active = false". Page with startPosition and the returned nextStartPosition (null on the last page).',
		idempotent: true,
	},
	props: {
		where: quickbooksAiProps.where({ required: false }),
		orderBy: quickbooksAiProps.orderBy({ required: false }),
		limit: quickbooksAiProps.limit({ required: false }),
		startPosition: quickbooksAiProps.startPosition({ required: false }),
	},
	async run(context) {
		const { where, orderBy, limit, startPosition } = context.propsValue;
		return await quickbooksApi.listEntities({
			auth: context.auth,
			entity: 'Vendor',
			where,
			orderBy,
			limit,
			startPosition,
		});
	},
});
