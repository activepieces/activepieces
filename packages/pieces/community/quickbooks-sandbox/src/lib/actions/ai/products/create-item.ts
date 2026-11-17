import { createAction, Property } from '@activepieces/pieces-framework';
import { quickbooksAuth } from '../../../auth';
import { quickbooksAiProps } from '../../../common/ai-props';
import { quickbooksApi } from '../../../common/api';
import { quickbooksUtils } from '../../../common/utils';
import { quickbooksSandboxCreateItemOutputSchema } from '../../../output-schemas';

export const createItemAction = createAction({
	auth: quickbooksAuth,
	name: 'quickbooks_sandbox_create_item',
	outputSchema: quickbooksSandboxCreateItemOutputSchema,
	displayName: 'Create Item',
	description: 'Creates a product or service.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Creates an item of type Service, NonInventory or Inventory. Service and NonInventory need an income account id; Inventory needs QuickBooks Plus or Advanced and the income, expense and asset account ids, Track Quantity On Hand = Yes, Quantity On Hand and Inventory Start Date. Account ids come from List Accounts; bundles cannot be created through the API. Not idempotent: each call creates a new item, and names must be unique.',
		idempotent: false,
	},
	props: {
		name: Property.ShortText({
			displayName: 'Name',
			description: 'Item name, unique across all items.',
			required: true,
		}),
		type: Property.StaticDropdown({
			displayName: 'Type',
			description: 'Service, NonInventory or Inventory. Inventory tracks quantity and needs QuickBooks Plus or Advanced.',
			required: true,
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
			description: 'Account id that records sales of this item, usually an Income account. Required for Service, NonInventory and Inventory items. Use List Accounts to find it.',
		}),
		expenseAccountId: quickbooksAiProps.id({
			required: false,
			displayName: 'Expense Account ID',
			description: 'Account id that records purchases of this item; for Inventory items the Cost of Goods Sold account. Required for Inventory. Use List Accounts to find it.',
		}),
		assetAccountId: quickbooksAiProps.id({
			required: false,
			displayName: 'Asset Account ID',
			description: 'Inventory asset account id (an Other Current Asset account). Required for Inventory. Use List Accounts to find it.',
		}),
		trackQtyOnHand: quickbooksAiProps.flag({
			required: false,
			displayName: 'Track Quantity On Hand',
			description: 'Whether QuickBooks tracks the quantity. Must be Yes for Inventory items.',
		}),
		qtyOnHand: Property.Number({
			displayName: 'Quantity On Hand',
			description: 'Starting quantity in stock. Required for Inventory.',
			required: false,
		}),
		invStartDate: quickbooksAiProps.date({
			required: false,
			displayName: 'Inventory Start Date',
			description: 'Date the starting quantity applies from, YYYY-MM-DD. Required for Inventory.',
		}),
		sku: Property.ShortText({ displayName: 'SKU', description: 'Stock keeping unit.', required: false }),
		description: Property.LongText({
			displayName: 'Description',
			description: 'Sales description shown on invoices and receipts.',
			required: false,
		}),
		unitPrice: Property.Number({ displayName: 'Unit Price', description: 'Sales price per unit.', required: false }),
		purchaseDescription: Property.LongText({
			displayName: 'Purchase Description',
			description: 'Description shown on purchase orders and bills.',
			required: false,
		}),
		purchaseCost: Property.Number({ displayName: 'Purchase Cost', description: 'Cost per unit when bought.', required: false }),
		taxable: quickbooksAiProps.flag({
			required: false,
			displayName: 'Taxable',
			description: 'Whether sales of this item are taxable (US companies).',
		}),
		additionalFields: quickbooksAiProps.additionalFields({
			required: false,
			description:
				'Optional JSON object with any other Item fields, in QuickBooks\' own field names, e.g. {"SubItem": true, "ParentRef": {"value": "5"}, "ReorderPoint": 10}. The dedicated inputs override the same fields here.',
		}),
	},
	async run(context) {
		const {
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
		return await quickbooksApi.createEntity({
			auth: context.auth,
			entity: 'Item',
			body: {
				...additionalFields,
				...quickbooksUtils.compact({
					fields: {
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
		});
	},
});
