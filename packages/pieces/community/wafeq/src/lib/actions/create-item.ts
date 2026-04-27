import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { wafeqAuth } from '../common/auth';
import { wafeqApiCall } from '../common/client';
import { wafeqProps } from '../common/props';
import { wafeqHelpers } from '../common/helpers';

export const createItem = createAction({
  auth: wafeqAuth,
  name: 'create_item',
  displayName: 'Create Item',
  description:
    'Add a product or service to your Wafeq catalog. Catalog items can be quickly added to invoices, bills, and quotes without retyping descriptions or prices.',
  props: {
    name: Property.ShortText({
      displayName: 'Name',
      description:
        'What the product or service is called (e.g. "Pro subscription", "Consulting hour"). This shows up in item pickers.',
      required: true,
    }),
    description: Property.LongText({
      displayName: 'Description',
      description:
        'Optional longer description used as the default line text when this item is added to an invoice.',
      required: false,
    }),
    sku: Property.ShortText({
      displayName: 'SKU / Product Code',
      description:
        'Optional short code (e.g. "SUB-PRO-YR"). Useful if you also track the item in another system.',
      required: false,
    }),
    unit_price: Property.Number({
      displayName: 'Sale Price',
      description:
        'How much you charge customers per unit. Used as the default on invoices and quotes.',
      required: false,
    }),
    unit_cost: Property.Number({
      displayName: 'Purchase Cost',
      description:
        'How much you pay suppliers per unit. Used as the default on bills.',
      required: false,
    }),
    revenue_account: Property.ShortText({
      displayName: 'Sales Account ID (advanced)',
      description:
        'Advanced. The account ID sales of this item post to (e.g. "Sales Revenue"). Leave blank to use your org default.',
      required: false,
    }),
    expense_account: Property.ShortText({
      displayName: 'Cost Account ID (advanced)',
      description:
        'Advanced. The account ID purchases of this item post to.',
      required: false,
    }),
    revenue_tax_rate: Property.ShortText({
      displayName: 'Sales Tax Rate ID (advanced)',
      description:
        'Advanced. Tax rate ID applied when selling this item. Leave blank for no default tax.',
      required: false,
    }),
    purchase_tax_rate: Property.ShortText({
      displayName: 'Purchase Tax Rate ID (advanced)',
      description:
        'Advanced. Tax rate ID applied when buying this item.',
      required: false,
    }),
    is_tracked_inventory: Property.Checkbox({
      displayName: 'Track Stock Levels?',
      description:
        'Turn on for physical products where you want Wafeq to track inventory counts. Leave off for services and digital products.',
      required: false,
      defaultValue: false,
    }),
    is_active: Property.Checkbox({
      displayName: 'Active',
      description:
        'Active items can be added to new invoices. Turn off to hide the item from pickers without deleting it.',
      required: false,
      defaultValue: true,
    }),
    external_id: wafeqProps.externalId('Your Product ID'),
    idempotency_key: wafeqProps.idempotencyKey,
  },
  async run(context) {
    const p = context.propsValue;
    const body = wafeqHelpers.stripEmpty({
      name: p.name,
      description: p.description,
      sku: p.sku,
      unit_price: p.unit_price,
      unit_cost: p.unit_cost,
      revenue_account: p.revenue_account,
      expense_account: p.expense_account,
      revenue_tax_rate: p.revenue_tax_rate,
      purchase_tax_rate: p.purchase_tax_rate,
      is_tracked_inventory: p.is_tracked_inventory,
      is_active: p.is_active,
      external_id: p.external_id,
    });
    const response = await wafeqApiCall<ItemResponse>({
      apiKey: context.auth.secret_text,
      method: HttpMethod.POST,
      path: '/items/',
      body,
      idempotencyKey: p.idempotency_key as string | undefined,
    });
    return flattenItem(response.body);
  },
});

function flattenItem(i: ItemResponse): Record<string, unknown> {
  return {
    id: i.id,
    name: i.name,
    description: i.description ?? null,
    sku: i.sku ?? null,
    unit_price: i.unit_price ?? null,
    unit_cost: i.unit_cost ?? null,
    revenue_account_id: i.revenue_account ?? null,
    expense_account_id: i.expense_account ?? null,
    revenue_tax_rate_id: i.revenue_tax_rate ?? null,
    purchase_tax_rate_id: i.purchase_tax_rate ?? null,
    is_tracked_inventory: i.is_tracked_inventory ?? null,
    is_active: i.is_active ?? null,
    external_id: i.external_id ?? null,
    created_ts: i.created_ts ?? null,
    modified_ts: i.modified_ts ?? null,
  };
}

type ItemResponse = {
  id: string;
  name: string;
  description?: string;
  sku?: string;
  unit_price?: number;
  unit_cost?: number;
  revenue_account?: string;
  expense_account?: string;
  revenue_tax_rate?: string;
  purchase_tax_rate?: string;
  is_tracked_inventory?: boolean;
  is_active?: boolean;
  external_id?: string;
  created_ts?: string;
  modified_ts?: string;
};
