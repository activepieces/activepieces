import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { xeroAuth } from '../..';
import { props } from '../common/props';
import { XERO_URLS, xeroApi, xeroInput } from '../common/client';
import { xeroOutputSchemas } from '../output-schemas';

export const xeroUpsertItem = createAction({
  auth: xeroAuth,
  name: 'xero_upsert_item',
  classification: 'WRITE',
  displayName: 'Create or Update Item',
  description: 'Creates a product or service item, or updates the item that already has this code.',
  audience: 'both',
  aiMetadata: {
    description:
      'Creates or updates a Xero item (product or service) keyed by its Item Code, with sales and purchase prices, account codes and tax types; set an Inventory Asset Account Code and a COGS Account Code to make it a tracked inventory item. When updating, pass every sales or purchase price, account and tax field you want to keep, because Xero replaces each details block as a whole. Use Find Item to read an item. Idempotent on the code: Xero updates the item that already has this code instead of creating a duplicate.',
    idempotent: true,
  },
  outputSchema: xeroOutputSchemas.item,
  props: {
    tenant_id: props.tenant_id,
    code: Property.ShortText({ displayName: 'Item Code', description: 'Unique code of the item (max 30 characters).', required: true }),
    name: Property.ShortText({ displayName: 'Name', description: 'Item name (max 50 characters).', required: false }),
    description: Property.LongText({ displayName: 'Sales Description', required: false }),
    purchase_description: Property.LongText({ displayName: 'Purchase Description', required: false }),
    is_sold: Property.Checkbox({ displayName: 'Is Sold', required: false }),
    is_purchased: Property.Checkbox({ displayName: 'Is Purchased', required: false }),
    sales_unit_price: Property.Number({ displayName: 'Sales Unit Price', description: 'Up to 4 decimal places.', required: false }),
    sales_account_code: Property.ShortText({ displayName: 'Sales Account Code', description: 'Revenue account code, e.g. 200. Use List Accounts to find codes.', required: false }),
    sales_tax_type: Property.ShortText({ displayName: 'Sales Tax Type', description: 'Tax type from List Tax Rates, e.g. OUTPUT.', required: false }),
    purchase_unit_price: Property.Number({ displayName: 'Purchase Unit Price', description: 'Up to 4 decimal places.', required: false }),
    purchase_account_code: Property.ShortText({ displayName: 'Purchase Account Code', description: 'Expense account code, e.g. 400. Not used for tracked inventory items.', required: false }),
    purchase_tax_type: Property.ShortText({ displayName: 'Purchase Tax Type', description: 'Tax type from List Tax Rates, e.g. INPUT.', required: false }),
    cogs_account_code: Property.ShortText({ displayName: 'COGS Account Code', description: 'Cost of goods sold account code; required for tracked inventory items.', required: false }),
    inventory_asset_account_code: Property.ShortText({
      displayName: 'Inventory Asset Account Code',
      description: 'Inventory asset account code. Setting it makes the item a tracked inventory item.',
      required: false,
    }),
  },
  async run(context) {
    const values = context.propsValue;
    const code = xeroInput.requiredText({ value: values.code, field: 'Item Code' });
    const text = (value: unknown) => xeroInput.trimmedOrUndefined({ value });
    const salesPrice = xeroInput.optionalDecimal({ value: values.sales_unit_price, field: 'Sales Unit Price', maxDecimals: 4 });
    const purchasePrice = xeroInput.optionalDecimal({ value: values.purchase_unit_price, field: 'Purchase Unit Price', maxDecimals: 4 });
    const inventoryAccount = text(values.inventory_asset_account_code);
    const cogsAccount = text(values.cogs_account_code);
    if (inventoryAccount && !cogsAccount) {
      throw new Error('A tracked inventory item needs a COGS Account Code as well as the Inventory Asset Account Code.');
    }
    const salesDetails = {
      ...(salesPrice !== undefined ? { UnitPrice: salesPrice } : {}),
      ...(text(values.sales_account_code) ? { AccountCode: text(values.sales_account_code) } : {}),
      ...(text(values.sales_tax_type) ? { TaxType: text(values.sales_tax_type) } : {}),
    };
    const purchaseDetails = {
      ...(purchasePrice !== undefined ? { UnitPrice: purchasePrice } : {}),
      ...(text(values.purchase_account_code) ? { AccountCode: text(values.purchase_account_code) } : {}),
      ...(cogsAccount ? { COGSAccountCode: cogsAccount } : {}),
      ...(text(values.purchase_tax_type) ? { TaxType: text(values.purchase_tax_type) } : {}),
    };
    const item = {
      Code: code,
      ...(text(values.name) ? { Name: text(values.name) } : {}),
      ...(text(values.description) ? { Description: text(values.description) } : {}),
      ...(text(values.purchase_description) ? { PurchaseDescription: text(values.purchase_description) } : {}),
      ...(typeof values.is_sold === 'boolean' ? { IsSold: values.is_sold } : {}),
      ...(typeof values.is_purchased === 'boolean' ? { IsPurchased: values.is_purchased } : {}),
      ...(Object.keys(salesDetails).length > 0 ? { SalesDetails: salesDetails } : {}),
      ...(Object.keys(purchaseDetails).length > 0 ? { PurchaseDetails: purchaseDetails } : {}),
      ...(inventoryAccount ? { InventoryAssetAccountCode: inventoryAccount, IsTrackedAsInventory: true } : {}),
    };
    const body = await xeroApi.request<unknown>({
      accessToken: context.auth.access_token,
      tenantId: values.tenant_id,
      method: HttpMethod.POST,
      url: `${XERO_URLS.api}/Items`,
      queryParams: { unitdp: '4' },
      body: { Items: [item] },
      operation: 'create or update item',
    });
    return xeroApi.firstRecord({ body, key: 'Items', operation: 'create or update item' });
  },
});
