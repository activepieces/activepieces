import { createAction, Property } from '@activepieces/pieces-framework';
import { quickbooksAuth } from '../../../auth';
import { quickbooksAiProps } from '../../../common/ai-props';
import { quickbooksApi } from '../../../common/api';
import { quickbooksUtils } from '../../../common/utils';
import { quickbooksSandboxUpdateItemOutputSchema } from '../../../output-schemas';

export const updateItemAction = createAction({
	auth: quickbooksAuth,
	name: 'quickbooks_sandbox_update_item',
	outputSchema: quickbooksSandboxUpdateItemOutputSchema,
	displayName: 'Update Item',
	description: 'Changes fields of an existing product or service, or deactivates it.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Changes only the fields you set on one item (a sparse update); the latest SyncToken is read first. Items cannot be deleted: set Active to No to deactivate one, Yes to restore it. The same type rules as Create Item apply (Inventory needs Plus or Advanced and its three accounts). Get the id from List Items.',
		idempotent: true,
	},
	props: {
		itemId: quickbooksAiProps.id({
			required: true,
			displayName: 'Item ID',
			description: 'QuickBooks item id. Use List Items to find it.',
		}),
		active: quickbooksAiProps.flag({
			required: false,
			displayName: 'Active',
			description: 'No deactivates the item (QuickBooks has no item delete); Yes reactivates it.',
		}),
		name: Property.ShortText({ displayName: 'Name', description: 'New item name, unique across all items.', required: false }),
		type: Property.StaticDropdown({
			displayName: 'Type',
			description: 'New type: Service, NonInventory or Inventory.',
			required: false,
			options: {
				disabled: false,
				options: [
					{ label: 'Service', value: 'Service' },
					{ label: 'Non-Inventory', value: 'NonInventory' },
					{ label: 'Inventory', value: 'Inventory' },
				],
			},
		}),
		incomeAccountId: quickbooksAiProps.id({
			required: false,
			displayName: 'Income Account ID',
			description: 'New income account id. Use List Accounts to find it.',
		}),
		expenseAccountId: quickbooksAiProps.id({
			required: false,
			displayName: 'Expense Account ID',
			description: 'New expense or Cost of Goods Sold account id. Use List Accounts to find it.',
		}),
		assetAccountId: quickbooksAiProps.id({
			required: false,
			displayName: 'Asset Account ID',
			description: 'New inventory asset account id. Use List Accounts to find it.',
		}),
		trackQtyOnHand: quickbooksAiProps.flag({
			required: false,
			displayName: 'Track Quantity On Hand',
			description: 'Whether QuickBooks tracks the quantity. Must be Yes for Inventory items.',
		}),
		qtyOnHand: Property.Number({
			displayName: 'Quantity On Hand',
			description: 'New quantity in stock. To record a stock change with an offset account, use Create Inventory Adjustment instead.',
			required: false,
		}),
		invStartDate: quickbooksAiProps.date({
			required: false,
			displayName: 'Inventory Start Date',
			description: 'New inventory start date, YYYY-MM-DD.',
		}),
		sku: Property.ShortText({ displayName: 'SKU', description: 'New stock keeping unit.', required: false }),
		description: Property.LongText({ displayName: 'Description', description: 'New sales description.', required: false }),
		unitPrice: Property.Number({ displayName: 'Unit Price', description: 'New sales price per unit.', required: false }),
		purchaseDescription: Property.LongText({
			displayName: 'Purchase Description',
			description: 'New purchase description.',
			required: false,
		}),
		purchaseCost: Property.Number({ displayName: 'Purchase Cost', description: 'New cost per unit.', required: false }),
		taxable: quickbooksAiProps.flag({
			required: false,
			displayName: 'Taxable',
			description: 'Whether sales of this item are taxable (US companies).',
		}),
		additionalFields: quickbooksAiProps.additionalFields({
			required: false,
			description:
				'Optional JSON object with any other Item fields, in QuickBooks\' own field names, e.g. {"ReorderPoint": 10, "ParentRef": {"value": "5"}}. The dedicated inputs override the same fields here.',
		}),
	},
	async run(context) {
		const {
			itemId,
			active,
			name,
			type,
			incomeAccountId,
			expenseAccountId,
			assetAccountId,
			trackQtyOnHand,
			qtyOnHand,
			invStartDate,
			sku,
			description,
			unitPrice,
			purchaseDescription,
			purchaseCost,
			taxable,
			additionalFields,
		} = context.propsValue;
		return await quickbooksApi.updateEntity({
			auth: context.auth,
			entity: 'Item',
			id: itemId,
			fields: quickbooksUtils.requireChanges({
				fields: {
					...additionalFields,
					...quickbooksUtils.compact({
						fields: {
							Active: active ? active === 'true' : undefined,
							Name: name,
							Type: type,
							IncomeAccountRef: quickbooksUtils.ref({ value: incomeAccountId }),
							ExpenseAccountRef: quickbooksUtils.ref({ value: expenseAccountId }),
							AssetAccountRef: quickbooksUtils.ref({ value: assetAccountId }),
							TrackQtyOnHand: trackQtyOnHand ? trackQtyOnHand === 'true' : undefined,
							QtyOnHand: qtyOnHand,
							InvStartDate: invStartDate,
							Sku: sku,
							Description: description,
							UnitPrice: unitPrice,
							PurchaseDesc: purchaseDescription,
							PurchaseCost: purchaseCost,
							Taxable: taxable ? taxable === 'true' : undefined,
						},
					}),
				},
			}),
		});
	},
});
