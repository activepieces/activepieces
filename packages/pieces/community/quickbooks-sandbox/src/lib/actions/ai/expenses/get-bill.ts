import { createAction } from '@activepieces/pieces-framework';
import { quickbooksAuth } from '../../../auth';
import { quickbooksAiProps } from '../../../common/ai-props';
import { quickbooksApi } from '../../../common/api';
import { quickbooksSandboxGetBillOutputSchema } from '../../../output-schemas';

export const getBillAction = createAction({
	auth: quickbooksAuth,
	name: 'quickbooks_sandbox_get_bill',
	outputSchema: quickbooksSandboxGetBillOutputSchema,
	displayName: 'Get Bill',
	description: 'Gets one bill by id.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			'Reads one bill with its lines, balance, due date and SyncToken. Get the id from List Bills or Create Bill.',
		idempotent: true,
	},
	props: {
		billId: quickbooksAiProps.id({
			required: true,
			displayName: 'Bill ID',
			description: 'QuickBooks bill id. Use List Bills to find it.',
		}),
	},
	async run(context) {
		return await quickbooksApi.getEntity({
			auth: context.auth,
			entity: 'Bill',
			id: context.propsValue.billId,
		});
	},
});
