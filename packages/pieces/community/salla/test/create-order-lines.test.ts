import { afterEach, describe, expect, it, vi } from 'vitest';
import { HttpMethod, HttpRequest, httpClient } from '@activepieces/pieces-common';
import { AppConnectionType, AppConnectionValueForAuthProperty, createMockActionContext, StaticPropsValue } from '@activepieces/pieces-framework';
import { createOrderAction } from '../src/lib/actions/create-order';
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

const BLANK_CREATE_ORDER: StaticPropsValue<typeof createOrderAction.props> = {
  customer: undefined,
  customer_name: undefined,
  customer_mobile: undefined,
  customer_email: undefined,
  products: [],
  delivery_method: undefined,
  branch: undefined,
  courier_id: undefined,
  country_id: undefined,
  city_id: undefined,
  district_id: undefined,
  block: undefined,
  street_number: undefined,
  building_number: undefined,
  address_line: undefined,
  postal_code: undefined,
  additional_number: undefined,
  short_address: undefined,
  latitude: undefined,
  longitude: undefined,
  payment_status: 'paid',
  payment_method: undefined,
  accepted_method: undefined,
  payment_reference_id: undefined,
  receipt_image_url: undefined,
  cash_on_delivery_fee: undefined,
  receiver_name: undefined,
  receiver_phone: undefined,
  receiver_email: undefined,
  receiver_country_code: undefined,
  receiver_notify: undefined,
  coupon_code: undefined,
};

async function runCreateOrder(products: unknown[]): Promise<HttpRequest[]> {
  const requests: HttpRequest[] = [];
  vi.spyOn(httpClient, 'sendRequest').mockImplementation(async (request: HttpRequest) => {
    requests.push(request);
    return { status: 201, headers: {}, body: { data: { id: 7 } } };
  });
  const propsValue = { ...BLANK_CREATE_ORDER, customer: '42', products };
  await createOrderAction.run({ ...createMockActionContext<typeof createOrderAction.props>({ propsValue }), auth: AUTH });
  return requests;
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('Create Order product rows', () => {
  it('reads Find Product By without caring about case or spaces', async () => {
    const requests = await runCreateOrder([
      { identifier_type: ' SKU ', identifier: '10023', quantity: 1 },
      { identifier_type: 'Id', identifier: 1764656014, quantity: 2 },
      { identifier: 1764656015, quantity: 1 },
    ]);
    const post = requests.find((request) => request.method === HttpMethod.POST);
    expect(post?.body).toMatchObject({
      products: [
        { identifier_type: 'sku', identifier: '10023', quantity: 1 },
        { identifier_type: 'id', identifier: 1764656014, quantity: 2 },
        { identifier_type: 'id', identifier: 1764656015, quantity: 1 },
      ],
    });
  });

  it('refuses an unknown Find Product By instead of sending the value as a product ID', async () => {
    await expect(runCreateOrder([{ identifier_type: 'name', identifier: '10023', quantity: 1 }])).rejects.toThrow(
      'Product row 1: Find Product By must be id or sku, but got "name".',
    );
  });
});
