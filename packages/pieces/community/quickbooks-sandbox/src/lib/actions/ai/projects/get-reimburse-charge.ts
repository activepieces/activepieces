import { createAction } from '@activepieces/pieces-framework';
import { quickbooksAuth } from '../../../auth';
import { quickbooksAiProps } from '../../../common/ai-props';
import { quickbooksApi } from '../../../common/api';
import { quickbooksSandboxGetReimburseChargeOutputSchema } from '../../../output-schemas';

export const getReimburseChargeAction = createAction({
	auth: quickbooksAuth,
	name: 'quickbooks_sandbox_get_reimburse_charge',
	outputSchema: quickbooksSandboxGetReimburseChargeOutputSchema,
	displayName: 'Get Reimburse Charge',
	description: 'Gets one reimburse charge by id.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description: 'Reads one reimburse charge (a billable expense not yet invoiced) with its customer, amount and linked expense. Needs billable expense tracking on. Get the id from List Reimburse Charges.',
		idempotent: true,
	},
	props: {
		reimburseChargeId: quickbooksAiProps.id({
			required: true,
			displayName: 'Reimburse Charge ID',
			description: 'QuickBooks reimburse charge id. Use List Reimburse Charges to find it.',
		}),
	},
	async run(context) {
		return await quickbooksApi.getEntity({
			auth: context.auth,
			entity: 'ReimburseCharge',
			id: context.propsValue.reimburseChargeId,
		});
	},
});
