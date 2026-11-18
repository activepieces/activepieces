import { createAction, Property } from '@activepieces/pieces-framework';
import { quickbooksAuth } from '../../../auth';
import { quickbooksAiProps } from '../../../common/ai-props';
import { quickbooksApi } from '../../../common/api';
import { quickbooksUtils } from '../../../common/utils';
import { quickbooksSandboxCreateInventoryAdjustmentOutputSchema } from '../../../output-schemas';

export const updateInventoryAdjustmentAction = createAction({
	auth: quickbooksAuth,
	name: 'quickbooks_sandbox_update_inventory_adjustment',
	outputSchema: quickbooksSandboxCreateInventoryAdjustmentOutputSchema,
	displayName: 'Update Inventory Adjustment',
	description: 'Changes fields of an existing inventory adjustment.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Changes the fields you set on one inventory adjustment and keeps the rest: it reads the current adjustment, merges your changes and sends the whole record back. Setting Lines replaces all existing lines, so pass the full list (from Get Inventory Adjustment) with your changes. Needs QuickBooks Plus or Advanced (US) with inventory tracking on; get the id from Create Inventory Adjustment or Run Query.',
		idempotent: true,
	},
	props: {
		inventoryAdjustmentId: quickbooksAiProps.id({
			required: true,
			displayName: 'Inventory Adjustment ID',
			description: 'QuickBooks inventory adjustment id, from Create Inventory Adjustment or Run Query.',
		}),
		adjustAccountId: quickbooksAiProps.id({
			required: false,
			displayName: 'Adjustment Account ID',
			description: 'New adjustment account id. Use List Accounts to find it.',
		}),
		lines: quickbooksAiProps.lines({
			required: false,
			description:
				'JSON array that replaces every line, e.g. [{"DetailType": "ItemAdjustmentLineDetail", "ItemAdjustmentLineDetail": {"ItemRef": {"value": "11"}, "QtyDiff": -3}}].',
		}),
		txnDate: quickbooksAiProps.date({
			required: false,
			displayName: 'Adjustment Date',
			description: 'New date, YYYY-MM-DD.',
		}),
		docNumber: Property.ShortText({ displayName: 'Reference Number', description: 'New reference number.', required: false }),
		privateNote: Property.LongText({ displayName: 'Memo', description: 'New internal note.', required: false }),
		additionalFields: quickbooksAiProps.additionalFields({ required: false }),
	},
	async run(context) {
		const { inventoryAdjustmentId, adjustAccountId, lines, txnDate, docNumber, privateNote, additionalFields } =
			context.propsValue;
		const changes = quickbooksUtils.requireChanges({
			fields: {
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
		return await quickbooksApi.replaceEntity({ auth: context.auth, entity: 'InventoryAdjustment', id: inventoryAdjustmentId, fields: changes });
	},
});
