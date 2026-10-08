import { Property, createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { xeroAuth } from '../..';
import { props } from '../common/props';
import { XERO_URLS, xeroApi, xeroValue } from '../common/client';
import { xeroOutputSchemas } from '../output-schemas';

export const xeroCreateInventoryItem = createAction({
  auth: xeroAuth,
  name: 'xero_create_inventory_item',
  classification: 'WRITE',
  displayName: 'Create Inventory Item',
  description: 'Creates a new inventory item in Xero.',
  audience: 'both',
  aiMetadata: {
    description:
      'Creates a Xero item (product or service) keyed by its item code, optionally tracked as inventory via sales, purchase, COGS and inventory-asset accounts picked by account. Pick this to register a catalog item that line items can later reference by ItemCode; use Create or Update Item to work with account codes directly. Idempotent on the code: if an item with this code already exists, Xero updates it instead of creating a duplicate.',
    idempotent: true,
  },
  outputSchema: xeroOutputSchemas.itemEnvelope,
  props: {
    tenant_id: props.tenant_id,
    code: Property.ShortText({
      displayName: 'Item Code',
      required: true,
    }),
    name: Property.ShortText({
      displayName: 'Name',
      required: false,
    }),
    description: Property.LongText({
      displayName: 'Sales Description',
      required: false,
    }),
    purchase_description: Property.LongText({
      displayName: 'Purchase Description',
      required: false,
    }),
    is_sold: Property.Checkbox({
      displayName: 'Is Sold',
      required: false,
      defaultValue: true,
    }),
    is_purchased: Property.Checkbox({
      displayName: 'Is Purchased',
      required: false,
      defaultValue: true,
    }),
    sales_details: Property.Object({
      displayName: 'Sales Details',
      required: false,
      defaultValue: {
        UnitPrice: 0,
      },
    }),
    sales_account_id: props.account_code(['REVENUE'], false),
    purchase_details: Property.Object({
      displayName: 'Purchase Details',
      required: false,
      defaultValue: {
        UnitPrice: 0,
      },
    }),
    purchase_account_id: props.account_code(['EXPENSE'], false),
    cogs_account_id: props.account_code(['COGS'], false),
    inventory_asset_account_id: props.account_code(['INVENTORY'], false),
  },
  async run(context) {
    const {
      tenant_id,
      code,
      name,
      description,
      purchase_description,
      is_sold,
      is_purchased,
      sales_details,
      purchase_details,
      sales_account_id,
      purchase_account_id,
      cogs_account_id,
      inventory_asset_account_id,
    } = context.propsValue;
    const accessToken = context.auth.access_token;
    const selected = [sales_account_id, purchase_account_id, cogs_account_id, inventory_asset_account_id].filter(
      (value): value is string => typeof value === 'string' && value.trim().length > 0,
    );
    const codes = selected.length > 0 ? await accountCodes({ accessToken, tenantId: tenant_id }) : new Map<string, string>();
    const codeOf = (value: unknown) => resolveAccountCode({ value, codes });
    const salesAccountCode = codeOf(sales_account_id);
    const purchaseAccountCode = codeOf(purchase_account_id);
    const cogsAccountCode = codeOf(cogs_account_id);
    const inventoryAccountCode = codeOf(inventory_asset_account_id);

    const item: Record<string, unknown> = {
      Code: code,
      ...(name ? { Name: name } : {}),
      ...(typeof is_sold === 'boolean' ? { IsSold: is_sold } : {}),
      ...(typeof is_purchased === 'boolean' ? { IsPurchased: is_purchased } : {}),
      ...(description ? { Description: description } : {}),
      ...(purchase_description ? { PurchaseDescription: purchase_description } : {}),
      ...(sales_details || salesAccountCode
        ? { SalesDetails: { ...(sales_details ?? {}), ...(salesAccountCode ? { AccountCode: salesAccountCode } : {}) } }
        : {}),
      ...(purchase_details || purchaseAccountCode || cogsAccountCode
        ? {
            PurchaseDetails: {
              ...(purchase_details ?? {}),
              ...(purchaseAccountCode ? { AccountCode: purchaseAccountCode } : {}),
              ...(cogsAccountCode ? { COGSAccountCode: cogsAccountCode } : {}),
            },
          }
        : {}),
      ...(inventoryAccountCode ? { InventoryAssetAccountCode: inventoryAccountCode, IsTrackedAsInventory: true } : {}),
    };

    return xeroApi.request<unknown>({
      accessToken,
      tenantId: tenant_id,
      method: HttpMethod.POST,
      url: `${XERO_URLS.api}/Items`,
      body: item,
      operation: 'create inventory item',
    });
  },
});

async function accountCodes({ accessToken, tenantId }: { accessToken: string; tenantId: string }): Promise<Map<string, string>> {
  const body = await xeroApi.request<unknown>({
    accessToken,
    tenantId,
    method: HttpMethod.GET,
    url: `${XERO_URLS.api}/Accounts`,
    operation: 'list accounts for item account codes',
  });
  return new Map(
    xeroApi.recordsOf({ body, key: 'Accounts' }).flatMap((account): [string, string][] => {
      const id = xeroValue.readString(account['AccountID']);
      const accountCode = xeroValue.readString(account['Code']);
      return id && accountCode ? [[id, accountCode]] : [];
    }),
  );
}

function resolveAccountCode({ value, codes }: { value: unknown; codes: Map<string, string> }): string | undefined {
  if (typeof value !== 'string' || value.trim().length === 0) return undefined;
  const key = value.trim();
  const fromId = codes.get(key);
  if (fromId) return fromId;
  if ([...codes.values()].includes(key)) return key;
  throw new Error(`Xero account ${key} was not found or has no account code; items can only use accounts that have a code.`);
}
