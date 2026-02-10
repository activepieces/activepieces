import { Property, createAction } from '@activepieces/pieces-framework';
import {
  AuthenticationType,
  HttpMethod,
  HttpRequest,
  httpClient,
} from '@activepieces/pieces-common';
import { xeroAuth } from '../..';
import { props } from '../common/props';

export const xeroCreateInventoryItem = createAction({
  auth: xeroAuth,
  name: 'xero_create_inventory_item',
  displayName: 'Create Inventory Item',
  description: 'Creates a new inventory item in Xero.',
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

    const url = 'https://api.xero.com/api.xro/2.0/Items';

    const item: Record<string, unknown> = {
      Code: code,
      ...(name ? { Name: name } : {}),
      ...(typeof is_sold === 'boolean' ? { IsSold: is_sold } : {}),
      ...(typeof is_purchased === 'boolean' ? { IsPurchased: is_purchased } : {}),
      ...(description ? { Description: description } : {}),
      ...(purchase_description ? { PurchaseDescription: purchase_description } : {}),
      ...(sales_details || sales_account_id
        ? { SalesDetails: { ...(sales_details ?? {}), ...(sales_account_id ? { AccountID: sales_account_id } : {}) } }
        : {}),
      ...(purchase_details || purchase_account_id || cogs_account_id
        ? {
            PurchaseDetails: {
              ...(purchase_details ?? {}),
              ...(purchase_account_id ? { AccountID: purchase_account_id } : {}),
              ...(cogs_account_id ? { COGSAccountID: cogs_account_id } : {}),
            },
          }
        : {}),
      ...(inventory_asset_account_id
        ? { InventoryAssetAccountCode: undefined, InventoryAssetAccountID: inventory_asset_account_id }
        : {}),
    };

    const payload = item;

    const request: HttpRequest = {
      method: HttpMethod.POST,
      url,
      body: payload,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: (context.auth as any).access_token,
      },
      headers: {
        'Xero-Tenant-Id': tenant_id,
      },
    };

    const result = await httpClient.sendRequest(request);
    if (result.status === 200) {
      return result.body;
    }
    return result;
  },
});


