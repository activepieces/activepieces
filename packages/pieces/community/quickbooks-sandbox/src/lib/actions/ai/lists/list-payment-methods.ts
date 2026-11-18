import { createAction } from '@activepieces/pieces-framework';
import { quickbooksAuth } from '../../../auth';
import { quickbooksAiProps } from '../../../common/ai-props';
import { quickbooksApi } from '../../../common/api';
import { quickbooksSandboxListPaymentMethodsOutputSchema } from '../../../output-schemas';

export const listPaymentMethodsAction = createAction({
	auth: quickbooksAuth,
	name: 'quickbooks_sandbox_list_payment_methods',
	outputSchema: quickbooksSandboxListPaymentMethodsOutputSchema,
	displayName: 'List Payment Methods',
	description: 'Lists payment methods, optionally filtered.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists payment methods (e.g. Cash, Check, Visa) one page at a time, with an optional QuickBooks query filter (e.g. "Type = \'CREDIT_CARD\'") and sort. Inactive payment methods are left out unless the filter asks for them (e.g. "Active = false"). Page with startPosition and the returned nextStartPosition (null on the last page).',
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
			entity: 'PaymentMethod',
			where,
			orderBy,
			limit,
			startPosition,
		});
	},
});
