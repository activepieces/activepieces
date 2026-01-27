import { createTrigger, TriggerStrategy, AppConnectionValueForAuthProperty } from '@activepieces/pieces-framework';
import { DedupeStrategy, Polling, pollingHelper } from '@activepieces/pieces-common';
import { bexioAuth } from '../../index';
import { BexioClient } from '../common/client';

const polling: Polling<
  AppConnectionValueForAuthProperty<typeof bexioAuth>,
  Record<string, never>
> = {
  strategy: DedupeStrategy.LAST_ITEM,
  items: async ({ auth, lastItemId }) => {
    const client = new BexioClient(auth);

    // Use GET endpoint to fetch all articles, then sort by ID descending
    // This avoids the issue with empty search arrays
    const queryParams: Record<string, string> = {
      limit: '500',
    };

    const products = await client.get<Array<{
      id: number;
      user_id: number;
      article_type_id: number;
      contact_id: number | null;
      deliverer_code: string | null;
      deliverer_name: string | null;
      deliverer_description: string | null;
      intern_code: string;
      intern_name: string;
      intern_description: string | null;
      purchase_price: string | null;
      sale_price: string | null;
      purchase_total: number | null;
      sale_total: number | null;
      currency_id: number | null;
      tax_income_id: number | null;
      tax_id: number | null;
      tax_expense_id: number | null;
      unit_id: number | null;
      is_stock: boolean;
      stock_id: number | null;
      stock_place_id: number | null;
      stock_nr: number;
      stock_min_nr: number;
      stock_reserved_nr: number;
      stock_available_nr: number;
      stock_picked_nr: number;
      stock_disposed_nr: number;
      stock_ordered_nr: number;
      width: number | null;
      height: number | null;
      weight: number | null;
      volume: number | null;
      html_text: string | null;
      remarks: string | null;
      delivery_price: number | null;
      article_group_id: number | null;
      account_id: number | null;
      expense_account_id: number | null;
    }>>('/2.0/article', queryParams);

    // Sort by ID descending to get newest first (since GET doesn't support order_by)
    const sortedProducts = products.sort((a, b) => b.id - a.id);

    return sortedProducts.map((product) => ({
      id: product.id,
      data: product,
    }));
  },
};

export const newProductTrigger = createTrigger({
  auth: bexioAuth,
  name: 'new_product',
  displayName: 'New Product',
  description: 'Triggers when a new product is created',
  type: TriggerStrategy.POLLING,
  props: {},
  sampleData: {
    id: 4,
    user_id: 1,
    article_type_id: 1,
    contact_id: 14,
    deliverer_code: null,
    deliverer_name: null,
    deliverer_description: null,
    intern_code: 'wh-2019',
    intern_name: 'Webhosting',
    intern_description: null,
    purchase_price: null,
    sale_price: null,
    purchase_total: null,
    sale_total: null,
    currency_id: null,
    tax_income_id: null,
    tax_id: null,
    tax_expense_id: null,
    unit_id: null,
    is_stock: false,
    stock_id: null,
    stock_place_id: null,
    stock_nr: 0,
    stock_min_nr: 0,
    stock_reserved_nr: 0,
    stock_available_nr: 0,
    stock_picked_nr: 0,
    stock_disposed_nr: 0,
    stock_ordered_nr: 0,
    width: null,
    height: null,
    weight: null,
    volume: null,
    html_text: null,
    remarks: null,
    delivery_price: null,
    article_group_id: null,
    account_id: null,
    expense_account_id: null,
  },
  onEnable: async (context) => {
    await pollingHelper.onEnable(polling, {
      auth: context.auth,
      store: context.store,
      propsValue: context.propsValue,
    });
  },
  onDisable: async (context) => {
    await pollingHelper.onDisable(polling, {
      auth: context.auth,
      store: context.store,
      propsValue: context.propsValue,
    });
  },
  test: async (context) => {
    return await pollingHelper.test(polling, {
      auth: context.auth,
      store: context.store,
      propsValue: context.propsValue,
      files: context.files,
    });
  },
  run: async (context) => {
    return await pollingHelper.poll(polling, {
      auth: context.auth,
      store: context.store,
      propsValue: context.propsValue,
      files: context.files,
    });
  },
});

