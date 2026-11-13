import { createAction, Property } from '@activepieces/pieces-framework';
import { quickbooksAuth } from '../../../auth';
import { quickbooksAiProps } from '../../../common/ai-props';
import { quickbooksApi } from '../../../common/api';
import { quickbooksUtils } from '../../../common/utils';
import { quickbooksSandboxCreateInventoryAdjustmentOutputSchema } from '../../../output-schemas';

export const createInventoryAdjustmentAction = createAction({
	auth: quickbooksAuth,
	name: 'quickbooks_sandbox_create_inventory_adjustment',
	outputSchema: quickbooksSandboxCreateInventoryAdjustmentOutputSchema,
	displayName: 'Create Inventory Adjustment',
	description: 'Adjusts the quantity on hand of inventory items.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Records a change in stock (shrinkage, damage, a count correction) for one or more Inventory items, booked against an adjustment account. Needs QuickBooks Plus or Advanced (US) with inventory tracking on; item ids come from List Items (Type = \'Inventory\') and the account id from List Accounts. Not idempotent: each call adjusts the quantity again.',
		idempotent: false,
	},
	props: {
		adjustAccountId: quickbooksAiProps.id({
			required: true,
			displayName: 'Adjustment Account ID',
			description: 'Account the value change is booked to, usually "Inventory Shrinkage" or another expense account. Use List Accounts to find it.',
		}),
		lines: quickbooksAiProps.lines({
			required: true,
			description:
				'JSON array of adjustment lines, one per item, e.g. [{"DetailType": "ItemAdjustmentLineDetail", "ItemAdjustmentLineDetail": {"ItemRef": {"value": "11"}, "QtyDiff": -2}}]. QtyDiff is the change in quantity: negative removes stock, positive adds it.',
		}),
		txnDate: quickbooksAiProps.date({
			required: false,
			displayName: 'Adjustment Date',
			description: 'Date of the adjustment, YYYY-MM-DD. Defaults to today.',
		}),
		docNumber: Property.ShortText({
			displayName: 'Reference Number',
			description: 'Reference number of the adjustment.',
			required: false,
		}),
		privateNote: Property.LongText({
			displayName: 'Memo',
			description: 'Internal note on the adjustment.',
			required: false,
		}),
		additionalFields: quickbooksAiProps.additionalFields({ required: false }),
	},
	async run(context) {
		const { adjustAccountId, lines, txnDate, docNumber, privateNote, additionalFields } = context.propsValue;
		return await quickbooksApi.createEntity({
			auth: context.auth,
			entity: 'InventoryAdjustment',
			body: {
				...additionalFields,
				...quickbooksUtils.compact({
					fields: {
						AdjustAccountRef: quickbooksUtils.ref({ value: adjustAccountId }),
						Line: quickbooksUtils.linesArray({ lines, propName: 'Lines' }),
						TxnDate: txnDate,
						DocNumber: docNumber,
						PrivateNote: privateNote,
					},
				}),
			},
		});
	},
});
