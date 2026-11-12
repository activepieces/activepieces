import { afterEach, describe, expect, it, vi } from 'vitest';
import { HttpMethod, HttpRequest, httpClient } from '@activepieces/pieces-common';
import { AppConnectionType, AppConnectionValueForAuthProperty, createMockActionContext, StaticPropsValue } from '@activepieces/pieces-framework';
import { updateOrderAction } from '../src/lib/actions/update-order';
import { aiUpdateOrderAction } from '../src/lib/actions/ai/update-order';
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

const BLANK_UPDATE_ORDER: StaticPropsValue<typeof updateOrderAction.props> = {
  order: '391872134',
  customer: undefined,
  customer_name: undefined,
  customer_mobile: undefined,
  customer_email: undefined,
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
  payment_status: undefined,
  payment_method: undefined,
  accepted_methods: undefined,
  store_bank_id: undefined,
  receipt_image_url: undefined,
  cash_on_delivery_fee: undefined,
  receiver_name: undefined,
  receiver_phone: undefined,
  receiver_email: undefined,
  receiver_country_code: undefined,
  receiver_notify: undefined,
  coupon_code: undefined,
  employee_ids: undefined,
};

const BLANK_AI_UPDATE_ORDER: StaticPropsValue<typeof aiUpdateOrderAction.props> = {
  order_id: 391872134,
  customer_id: undefined,
  customer_name: undefined,
  customer_mobile: undefined,
  customer_email: undefined,
  receiver_name: undefined,
  receiver_phone: undefined,
  receiver_email: undefined,
  receiver_country_code: undefined,
  receiver_notify: undefined,
  delivery_method: undefined,
  branch_id: undefined,
  courier_id: undefined,
  ship_to_country_id: undefined,
  ship_to_city_id: undefined,
  ship_to_district_id: undefined,
  ship_to_block: undefined,
  ship_to_street_number: undefined,
  ship_to_address_line: undefined,
  ship_to_postal_code: undefined,
  ship_to_short_address: undefined,
  ship_to_building_number: undefined,
  ship_to_additional_number: undefined,
  latitude: undefined,
  longitude: undefined,
  payment_status: undefined,
  payment_method: undefined,
  store_bank_id: undefined,
  receipt_image_url: undefined,
  accepted_methods: undefined,
  cash_on_delivery_fee: undefined,
  coupon_code: undefined,
  employee_ids: undefined,
};

const REFUSAL = 'Salla cannot change a customer\'s name, mobile or email from an order';

function recordRequests(): HttpRequest[] {
  const requests: HttpRequest[] = [];
  vi.spyOn(httpClient, 'sendRequest').mockImplementation(async (request: HttpRequest) => {
    requests.push(request);
    return { status: 200, headers: {}, body: { data: { id: 7 } } };
  });
  return requests;
}

function runHuman(propsValue: StaticPropsValue<typeof updateOrderAction.props>): Promise<unknown> {
  return updateOrderAction.run({ ...createMockActionContext<typeof updateOrderAction.props>({ propsValue }), auth: AUTH });
}

function runAi(propsValue: StaticPropsValue<typeof aiUpdateOrderAction.props>): Promise<unknown> {
  return aiUpdateOrderAction.run({ ...createMockActionContext<typeof aiUpdateOrderAction.props>({ propsValue }), auth: AUTH });
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('Update Order never sends customer details, which made Salla move the order to its visitor customer', () => {
  it('fails and sends nothing when only the customer email is filled', async () => {
    const requests = recordRequests();
    await expect(runHuman({ ...BLANK_UPDATE_ORDER, customer_email: 'sara@example.com' })).rejects.toThrow(REFUSAL);
    expect(requests).toEqual([]);
  });

  it('fails and sends nothing when a customer name or mobile is filled next to other changes', async () => {
    for (const details of [{ customer_name: 'Sara Alqahtani' }, { customer_mobile: '+966501234567' }]) {
      const requests = recordRequests();
      await expect(runHuman({ ...BLANK_UPDATE_ORDER, ...details, customer: '1675660619', coupon_code: 'SAVE10' })).rejects.toThrow(REFUSAL);
      expect(requests).toEqual([]);
      vi.restoreAllMocks();
    }
  });

  it('sends only the customer ID when moving the order to another customer', async () => {
    const requests = recordRequests();
    await runHuman({ ...BLANK_UPDATE_ORDER, customer: '1675660619', customer_email: ' ' });
    expect(requests.find((request) => request.method === HttpMethod.PUT)?.body).toEqual({ customer: { id: 1675660619 } });
  });

  it('keeps the three field keys so saved flows still load, under Advanced', () => {
    const keys: Array<'customer_name' | 'customer_mobile' | 'customer_email'> = ['customer_name', 'customer_mobile', 'customer_email'];
    for (const key of keys) {
      expect(updateOrderAction.props[key]).toMatchObject({ required: false, advanced: true });
      expect(aiUpdateOrderAction.props[key]).toMatchObject({ required: false });
    }
  });

  it('AI Update Order fails and sends nothing when customer details are filled', async () => {
    const requests = recordRequests();
    await expect(runAi({ ...BLANK_AI_UPDATE_ORDER, customer_id: 15, customer_email: 'sara@example.com' })).rejects.toThrow(REFUSAL);
    expect(requests).toEqual([]);
  });

  it('AI Update Order sends only the customer ID', async () => {
    const requests = recordRequests();
    await runAi({ ...BLANK_AI_UPDATE_ORDER, customer_id: 15 });
    expect(requests.find((request) => request.method === HttpMethod.PUT)?.body).toEqual({ customer: { id: 15 } });
  });
});
