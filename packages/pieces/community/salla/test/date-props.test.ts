import { afterEach, describe, expect, it, vi } from 'vitest';
import { HttpMethod, HttpRequest, httpClient } from '@activepieces/pieces-common';
import {
  Action,
  AppConnectionType,
  AppConnectionValueForAuthProperty,
  createMockActionContext,
  InputPropertyMap,
  StaticPropsValue,
} from '@activepieces/pieces-framework';
import { createCustomerAction } from '../src/lib/actions/create-customer';
import { createProductAction } from '../src/lib/actions/create-product';
import { updateCustomerAction } from '../src/lib/actions/update-customer';
import { updateProductPriceAction } from '../src/lib/actions/update-product-price';
import { updateProductAction } from '../src/lib/actions/update-product';
import { sallaAuth } from '../src/lib/auth';

const AUTH: AppConnectionValueForAuthProperty<typeof sallaAuth> = {
  type: AppConnectionType.OAUTH2,
  access_token: 'token',
  client_id: 'client',
  client_secret: 'secret',
  redirect_url: 'https://example.com',
  token_type: 'Bearer',
  claimed_at: 0,
  refresh_token: 'refresh',
  scope: '',
  token_url: 'https://accounts.salla.sa/oauth2/token',
  data: {},
  props: {},
};

const BLANK_CREATE_PRODUCT: StaticPropsValue<typeof createProductAction.props> = {
  name: 'Item',
  product_type: 'product',
  description: undefined,
  status: undefined,
  categories: undefined,
  brand: undefined,
  price: 10,
  sale_price: undefined,
  cost_price: undefined,
  sale_start: undefined,
  sale_end: undefined,
  sku: undefined,
  quantity: undefined,
  unlimited_quantity: undefined,
  weight: undefined,
  weight_type: undefined,
  require_shipping: undefined,
  image_urls: undefined,
  mpn: undefined,
  gtin: undefined,
  maximum_quantity_per_order: undefined,
  hide_quantity: undefined,
  enable_upload_image: undefined,
  enable_note: undefined,
  subtitle: undefined,
  promotion_title: undefined,
  promotion_subtitle: undefined,
  metadata_title: undefined,
  metadata_description: undefined,
  metadata_url: undefined,
  calories: undefined,
};

const BLANK_UPDATE_PRODUCT: StaticPropsValue<typeof updateProductAction.props> = {
  find_by: 'id',
  product: '7',
  lookup_sku: undefined,
  name: undefined,
  description: undefined,
  status: undefined,
  categories: undefined,
  brand: undefined,
  price: undefined,
  sale_price: undefined,
  cost_price: undefined,
  sale_start: undefined,
  sale_end: undefined,
  sku: undefined,
  quantity: undefined,
  unlimited_quantity: undefined,
  weight: undefined,
  weight_type: undefined,
  require_shipping: undefined,
  mpn: undefined,
  gtin: undefined,
  maximum_quantity_per_order: undefined,
  hide_quantity: undefined,
  enable_upload_image: undefined,
  enable_note: undefined,
  subtitle: undefined,
  promotion_title: undefined,
  promotion_subtitle: undefined,
  metadata_title: undefined,
  metadata_description: undefined,
  metadata_url: undefined,
  calories: undefined,
};

const BLANK_UPDATE_PRODUCT_PRICE: StaticPropsValue<typeof updateProductPriceAction.props> = {
  sku: 'SKU-1',
  price: 10,
  sale_price: undefined,
  sale_end: undefined,
};

const BLANK_CREATE_CUSTOMER: StaticPropsValue<typeof createCustomerAction.props> = {
  first_name: 'Ali',
  last_name: 'Saleh',
  mobile: '+966501234567',
  email: undefined,
  gender: undefined,
  birthday: undefined,
  groups: undefined,
  mobile_country_code: undefined,
  country_code: undefined,
};

const BLANK_UPDATE_CUSTOMER: StaticPropsValue<typeof updateCustomerAction.props> = {
  customer: '7',
  first_name: undefined,
  last_name: undefined,
  mobile: undefined,
  email: undefined,
  gender: undefined,
  birthday: undefined,
  groups: undefined,
  mobile_country_code: undefined,
  country_code: undefined,
};

const LATE_EVENING = '2026-11-30T22:00:00.000Z';
const LATE_EVENING_START = '2026-11-29T23:30:00.000Z';

async function sentBody<Props extends InputPropertyMap>({
  action,
  propsValue,
}: {
  action: Action<typeof sallaAuth, Props>;
  propsValue: StaticPropsValue<Props>;
}): Promise<unknown> {
  const requests: HttpRequest[] = [];
  vi.spyOn(httpClient, 'sendRequest').mockImplementation(async (request: HttpRequest) => {
    requests.push(request);
    return { status: 200, headers: {}, body: { data: { id: 7, name: 'Item', sku: 'SKU-1', price: { amount: 10 } } } };
  });
  await action.run({ ...createMockActionContext<Props>({ propsValue }), auth: AUTH });
  const write = requests.find((request) => request.method !== HttpMethod.GET);
  expect(write).toBeDefined();
  return write?.body;
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('store-local dates entered after 21:00 keep their calendar day', () => {
  it('Create Product', async () => {
    const body = await sentBody({
      action: createProductAction,
      propsValue: { ...BLANK_CREATE_PRODUCT, sale_price: 8, sale_start: LATE_EVENING_START, sale_end: LATE_EVENING },
    });
    expect(body).toMatchObject({ sale_start: '2026-11-29', sale_end: '2026-11-30' });
  });

  it('Update Product', async () => {
    const body = await sentBody({
      action: updateProductAction,
      propsValue: { ...BLANK_UPDATE_PRODUCT, sale_price: 8, sale_start: LATE_EVENING_START, sale_end: LATE_EVENING },
    });
    expect(body).toMatchObject({ sale_start: '2026-11-29', sale_end: '2026-11-30' });
  });

  it('Update Product Price', async () => {
    const body = await sentBody({
      action: updateProductPriceAction,
      propsValue: { ...BLANK_UPDATE_PRODUCT_PRICE, sale_price: 8, sale_end: LATE_EVENING },
    });
    expect(body).toMatchObject({ sale_end: '2026-11-30' });
  });

  it('Create Customer', async () => {
    const body = await sentBody({
      action: createCustomerAction,
      propsValue: { ...BLANK_CREATE_CUSTOMER, birthday: LATE_EVENING },
    });
    expect(body).toMatchObject({ birthday: '2026-11-30' });
  });

  it('Update Customer', async () => {
    const body = await sentBody({
      action: updateCustomerAction,
      propsValue: { ...BLANK_UPDATE_CUSTOMER, birthday: LATE_EVENING },
    });
    expect(body).toMatchObject({ birthday: '2026-11-30' });
  });
});
