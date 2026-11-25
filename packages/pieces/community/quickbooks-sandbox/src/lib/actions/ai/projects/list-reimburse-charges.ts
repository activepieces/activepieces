import { createAction } from '@activepieces/pieces-framework';
import { quickbooksAuth } from '../../../auth';
import { quickbooksAiProps } from '../../../common/ai-props';
import { quickbooksApi } from '../../../common/api';
import { quickbooksSandboxListReimburseChargesOutputSchema } from '../../../output-schemas';

export const listReimburseChargesAction = createAction({
	auth: quickbooksAuth,
	name: 'quickbooks_sandbox_list_reimburse_charges',
	outputSchema: quickbooksSandboxListReimburseChargesOutputSchema,
	displayName: 'List Reimburse Charges',
	description: 'Lists reimburse charges, optionally filtered.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists reimburse charges, the billable expenses waiting to be added to a customer invoice, with an optional QuickBooks query filter (e.g. "CustomerRef = \'58\'") and sort. Needs billable expense tracking on. Page with startPosition and the returned nextStartPosition (null on the last page).',
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
			entity: 'ReimburseCharge',
			where,
			orderBy,
			limit,
			startPosition,
		});
	},
});
