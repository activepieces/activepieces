import { afterEach, describe, expect, it, vi } from 'vitest';
import { HttpError, HttpMethod, HttpRequest, httpClient } from '@activepieces/pieces-common';
import { sallaApi } from '../src/lib/common/client';
import { AddressInput, CreateOrderInput, sallaOrders } from '../src/lib/common/orders';

const auth = { access_token: 'token' };

afterEach(() => {
  vi.restoreAllMocks();
});

const fullAddress: AddressInput = {
  countryId: '1473353380',
  cityId: 1939592358,
  districtId: '٢٠',
  block: ' Al Olaya ',
  streetNumber: '2929',
  addressLine: 'King Fahd Road',
  postalCode: '12211',
  shortAddress: 'RRRD2929',
  latitude: '24.7136',
  longitude: 46.6753,
};

const fullAddressBody = {
  country: 1473353380,
  city: 1939592358,
  district: 20,
  block: 'Al Olaya',
  street_number: '2929',
  address_line: 'King Fahd Road',
  postal_code: '12211',
  short_address: 'RRRD2929',
};

const updateAddress: AddressInput = { ...fullAddress, buildingNumber: '8228', additionalNumber: '2121' };

const updateAddressExtras = { building_number: '8228', additional_number: '2121' };

function baseCreateInput(overrides: Partial<CreateOrderInput> = {}): CreateOrderInput {
  return {
    customer: { id: 1227534533 },
    payment: { status: 'paid', method: 'bank' },
    products: [{ identifierType: 'id', identifier: '1764656014', quantity: 2 }],
    ...overrides,
  };
}

describe('buildOrderListQuery', () => {
  it('builds filters, encodes status as status[] and drops empty ones', () => {
    const query = sallaOrders.buildOrderListQuery({
      maxResults: 10,
      keyword: '  ahmed ',
      referenceId: '41027662',
      customerId: 1227534533,
      fromDate: '2026-11-01',
      toDate: '2026-11-01T22:30:00Z',
      statusIds: ['566146469', 986688842],
      paymentMethods: [' bank ', ''],
      branchIds: [],
      sortBy: 'created_at',
    });
    expect(query).toEqual({
      keyword: 'ahmed',
      reference_id: '41027662',
      customer_id: '1227534533',
      from_date: '2026-11-01',
      to_date: '2026-11-02',
      sort_by: 'created_at',
      status: ['566146469', '986688842'],
      payment_method: ['bank'],
    });
    const params = new URLSearchParams(sallaApi.buildQueryString(query));
    expect(params.getAll('status[]')).toEqual(['566146469', '986688842']);
    expect(params.getAll('payment_method[]')).toEqual(['bank']);
    expect(params.has('branch[]')).toBe(false);
  });

  it('leaves out unset filters', () => {
    const params = new URLSearchParams(sallaApi.buildQueryString(sallaOrders.buildOrderListQuery({ maxResults: 5, keyword: '  ' })));
    expect([...params.keys()]).toEqual([]);
  });

  it('rejects non-numeric IDs with the field name', () => {
    expect(() => sallaOrders.buildOrderListQuery({ maxResults: 5, statusIds: ['under_review'] })).toThrow('Status ID must be a numeric Salla ID');
    expect(() => sallaOrders.buildOrderListQuery({ maxResults: 5, referenceId: '#4102' })).toThrow('Reference number must be a numeric Salla ID');
  });
});

describe('listOrders', () => {
  it('walks pages in order with per_page 30 and returns flat orders', async () => {
    const spy = vi.spyOn(httpClient, 'sendRequest').mockImplementation(async (request: HttpRequest) => {
      const page = Number(new URL(request.url).searchParams.get('page'));
      return {
        status: 200,
        headers: {},
        body: {
          data: [{ id: page * 10, amounts: { total: { amount: page, currency: 'SAR' } } }, 'junk'],
          pagination: { count: 2, total: 4, perPage: 2, currentPage: page, totalPages: 2, links: page < 2 ? { next: 'x' } : [] },
        },
      };
    });
    const result = await sallaOrders.listOrders({ auth, filters: { maxResults: 50, statusIds: ['1'] } });
    const urls = spy.mock.calls.map((call) => new URL(call[0].url));
    expect(urls.map((url) => url.searchParams.get('page'))).toEqual(['1', '2']);
    expect(urls.every((url) => url.searchParams.get('per_page') === '30')).toBe(true);
    expect(urls[0].searchParams.getAll('status[]')).toEqual(['1']);
    expect(result.count).toBe(2);
    expect(result.truncated).toBe(false);
    expect(result.orders.map((order) => order['id'])).toEqual([10, 20]);
    expect(result.orders[0]).toMatchObject({ total_amount: 1, currency: 'SAR' });
  });

  it('reports truncated when maxResults cuts the list', async () => {
    vi.spyOn(httpClient, 'sendRequest').mockResolvedValue({
      status: 200,
      headers: {},
      body: { data: [{ id: 1 }, { id: 2 }, { id: 3 }], pagination: { currentPage: 1, totalPages: 9 } },
    });
    const result = await sallaOrders.listOrders({ auth, filters: { maxResults: 2 } });
    expect(result.count).toBe(2);
    expect(result.truncated).toBe(true);
  });
});

describe('cancelOrder', () => {
  it('posts the canceled slug with the note and flags, without listing statuses', async () => {
    const spy = vi.spyOn(httpClient, 'sendRequest').mockResolvedValue({ status: 201, headers: {}, body: { data: { message: 'canceled' } } });
    const result = await sallaOrders.cancelOrder({ auth, orderId: '2116149737', note: ' asked by phone ', restoreItems: true, sendStatusSms: false });
    expect(spy).toHaveBeenCalledTimes(1);
    const post = spy.mock.calls[0][0];
    expect(post.method).toBe(HttpMethod.POST);
    expect(post.url).toBe('https://api.salla.dev/admin/v2/orders/2116149737/status');
    expect(post.body).toEqual({ slug: 'canceled', note: 'asked by phone', restore_items: true, send_status_sms: false });
    expect(result).toEqual({ order_id: 2116149737, slug: 'canceled', status_id: undefined, message: 'canceled' });
  });

  it('sends only the slug when nothing else is set, and rejects a bad order ID', async () => {
    const spy = vi.spyOn(httpClient, 'sendRequest').mockResolvedValue({ status: 201, headers: {}, body: { data: {} } });
    await sallaOrders.cancelOrder({ auth, orderId: 5 });
    expect(spy.mock.calls[0][0].body).toEqual({ slug: 'canceled' });
    await expect(sallaOrders.cancelOrder({ auth, orderId: 'ref-1' })).rejects.toThrow('Order ID must be a numeric');
    expect(spy).toHaveBeenCalledTimes(1);
  });
});

describe('updateOrderStatus', () => {
  function mockStatusApi() {
    return vi.spyOn(httpClient, 'sendRequest').mockImplementation(async (request: HttpRequest) => {
      if (request.url.endsWith('/orders/statuses')) {
        return {
          status: 200,
          headers: {},
          body: {
            data: [
              { id: 566146469, name: 'Completed', slug: 'completed', type: 'original' },
              { id: 986688842, name: 'Packed', slug: 'in_progress', type: 'custom' },
            ],
          },
        };
      }
      return { status: 201, headers: {}, body: { data: { message: 'updated' } } };
    });
  }

  it('sends the slug for a built-in status picked by ID', async () => {
    const spy = mockStatusApi();
    const result = await sallaOrders.updateOrderStatus({ auth, orderId: '2116149737', status: '566146469', note: ' done ', sendStatusSms: false });
    expect(spy).toHaveBeenCalledTimes(2);
    const post = spy.mock.calls[1][0];
    expect(post.method).toBe(HttpMethod.POST);
    expect(post.url).toBe('https://api.salla.dev/admin/v2/orders/2116149737/status');
    expect(post.body).toEqual({ slug: 'completed', note: 'done', send_status_sms: false });
    expect(result).toEqual({ order_id: 2116149737, slug: 'completed', status_id: undefined, message: 'updated' });
  });

  it('sends status_id for a custom status', async () => {
    const spy = mockStatusApi();
    const result = await sallaOrders.updateOrderStatus({ auth, orderId: 5, status: 986688842, restoreItems: true });
    expect(spy.mock.calls[1][0].body).toEqual({ status_id: 986688842, restore_items: true });
    expect(result.status_id).toBe(986688842);
  });

  it('refuses the canceled slug in either spelling before any call', async () => {
    const spy = mockStatusApi();
    await expect(sallaOrders.updateOrderStatus({ auth, orderId: 5, status: 'cancelled' })).rejects.toThrow('Use the Cancel Order action');
    await expect(sallaOrders.updateOrderStatus({ auth, orderId: 5, status: ' Canceled ' })).rejects.toThrow('Use the Cancel Order action');
    expect(spy).not.toHaveBeenCalled();
  });

  it('refuses a canceled status picked by ID, and custom statuses under it, without posting', async () => {
    const spy = vi.spyOn(httpClient, 'sendRequest').mockImplementation(async () => ({
      status: 200,
      headers: {},
      body: {
        data: [
          { id: 100, name: 'Canceled', slug: 'canceled', type: 'original' },
          { id: 200, name: 'Customer changed mind', slug: 'in_progress', type: 'custom', parent: { id: 100, name: 'Canceled' } },
          { id: 300, name: 'Out of stock', type: 'custom', original: { id: 100, name: 'Canceled' } },
        ],
      },
    }));
    await expect(sallaOrders.updateOrderStatus({ auth, orderId: 5, status: 100 })).rejects.toThrow('Use the Cancel Order action');
    await expect(sallaOrders.updateOrderStatus({ auth, orderId: 5, status: '200' })).rejects.toThrow('Use the Cancel Order action');
    await expect(sallaOrders.updateOrderStatus({ auth, orderId: 5, status: 300 })).rejects.toThrow('Use the Cancel Order action');
    expect(spy.mock.calls.every(([request]) => request.method === HttpMethod.GET)).toBe(true);
  });

  it('throws before any call for an unknown slug or a bad order ID', async () => {
    const spy = mockStatusApi();
    await expect(sallaOrders.updateOrderStatus({ auth, orderId: 5, status: 'lost' })).rejects.toThrow('is not a Salla order status');
    await expect(sallaOrders.updateOrderStatus({ auth, orderId: 'ref-1', status: 'completed' })).rejects.toThrow('Order ID must be a numeric');
    expect(spy).not.toHaveBeenCalled();
  });
});

describe('buildCreateOrderBody', () => {
  it('sends ship_to.geo_coordinates.lang (Create Order spelling)', () => {
    const body = sallaOrders.buildCreateOrderBody(
      baseCreateInput({ deliveryMethod: 'shipping', shipTo: { ...fullAddress, buildingNumber: '7', additionalNumber: ' ' } }),
    );
    expect(body['ship_to']).toEqual({ ...fullAddressBody, building_number: '7', geo_coordinates: { lat: 24.7136, lang: 46.6753 } });
    expect(body['delivery_method']).toBe('shipping');
    expect(JSON.stringify(body)).not.toContain('"lng"');
  });

  it('drops a shipping address whose fields are all empty', () => {
    const body = sallaOrders.buildCreateOrderBody(
      baseCreateInput({ shipTo: { countryId: '', block: ' ', streetNumber: undefined, latitude: '', longitude: undefined } }),
    );
    expect(body).not.toHaveProperty('ship_to');
  });

  it('throws when only one of latitude and longitude is given', () => {
    expect(() => sallaOrders.buildCreateOrderBody(baseCreateInput({ shipTo: { ...fullAddress, longitude: '' } }))).toThrow(
      'Give both latitude and longitude for the shipping address, or neither.',
    );
    expect(() => sallaOrders.buildCreateOrderBody(baseCreateInput({ shipTo: { longitude: 46.6 } }))).toThrow('Give both latitude and longitude');
  });

  it('throws for a partly filled address and names every missing field', () => {
    expect(() =>
      sallaOrders.buildCreateOrderBody(baseCreateInput({ shipTo: { ...fullAddress, postalCode: ' ', shortAddress: undefined } })),
    ).toThrow('The shipping address is incomplete. Salla needs the full National Address; missing: postal_code, short_address.');
    expect(() => sallaOrders.buildCreateOrderBody(baseCreateInput({ shipTo: { ...fullAddress, latitude: undefined, longitude: undefined } }))).toThrow(
      'missing: geo_coordinates.',
    );
    expect(() => sallaOrders.buildCreateOrderBody(baseCreateInput({ shipTo: { cityId: 5 } }))).toThrow(
      'missing: country, district, block, street_number, address_line, postal_code, short_address, geo_coordinates.',
    );
  });

  it('does not need building_number or additional_number', () => {
    expect(() => sallaOrders.buildCreateOrderBody(baseCreateInput({ shipTo: fullAddress }))).not.toThrow();
  });

  it('compacts empty values', () => {
    const body = sallaOrders.buildCreateOrderBody(
      baseCreateInput({
        payment: { status: 'pending_payment', method: ' ', acceptedMethod: '', referenceId: '', receiptImagePath: undefined },
        receiver: { name: '', phone: ' ' },
        couponCode: '  ',
        courierId: '',
        branchId: '',
        shipTo: { block: '', latitude: '' },
      }),
    );
    expect(body).toEqual({
      customer: { id: 1227534533 },
      payment: { status: 'pending_payment' },
      products: [{ identifier_type: 'id', identifier: 1764656014, quantity: 2 }],
    });
  });

  it('uses name, mobile and email for a new customer', () => {
    const body = sallaOrders.buildCreateOrderBody(baseCreateInput({ customer: { name: ' Sara ', mobile: '+966557777777', email: '' } }));
    expect(body['customer']).toEqual({ name: 'Sara', mobile: '+966557777777' });
  });

  it('keeps SKUs as strings and defaults quantity to 1', () => {
    const body = sallaOrders.buildCreateOrderBody(baseCreateInput({ products: [{ identifierType: 'sku', identifier: ' SKU-1 ' }] }));
    expect(body['products']).toEqual([{ identifier_type: 'sku', identifier: 'SKU-1', quantity: 1 }]);
  });

  it('enforces the required parts', () => {
    expect(() => sallaOrders.buildCreateOrderBody(baseCreateInput({ products: [] }))).toThrow('Add at least one product');
    expect(() => sallaOrders.buildCreateOrderBody(baseCreateInput({ customer: { name: 'Sara' } }))).toThrow('Pick an existing customer');
    expect(() => sallaOrders.buildCreateOrderBody(baseCreateInput({ products: [{ identifierType: 'sku', identifier: ' ' }] }))).toThrow(
      'Each product line needs a product ID or SKU.',
    );
    expect(() => sallaOrders.buildCreateOrderBody(baseCreateInput({ products: [{ identifierType: 'id', identifier: '1', quantity: 0 }] }))).toThrow(
      'must be greater than 0',
    );
    expect(() => sallaOrders.buildCreateOrderBody(baseCreateInput({ products: [{ identifierType: 'id', identifier: 'SKU-1' }] }))).toThrow(
      'Product ID must be a numeric Salla ID',
    );
    expect(() => sallaOrders.buildCreateOrderBody(baseCreateInput({ customer: { id: 'abc' } }))).toThrow('Customer ID must be a number');
  });

  it('sends cash_on_delivery with amount 0 and the currency for cash on delivery without a fee', () => {
    const body = sallaOrders.buildCreateOrderBody(
      baseCreateInput({ payment: { status: 'paid', method: 'cod', cashOnDeliveryCurrency: 'SAR' } }),
    );
    expect(body['payment']).toEqual({ status: 'paid', method: 'cod', cash_on_delivery: { amount: 0, currency: 'SAR' } });
  });

  it('sends the cash on delivery fee with the currency', () => {
    const body = sallaOrders.buildCreateOrderBody(
      baseCreateInput({ payment: { status: 'paid', method: 'cod', cashOnDeliveryFee: '10', cashOnDeliveryCurrency: 'SAR' } }),
    );
    expect(body['payment']).toEqual({ status: 'paid', method: 'cod', cash_on_delivery: { amount: 10, currency: 'SAR' } });
  });

  it('throws when cash on delivery has no currency', () => {
    expect(() => sallaOrders.buildCreateOrderBody(baseCreateInput({ payment: { status: 'paid', method: 'cod' } }))).toThrow(
      'Could not read the store currency, which Salla needs for cash on delivery orders. Try again.',
    );
  });

  it('leaves cash_on_delivery out for other payment methods even when a fee is given', () => {
    const body = sallaOrders.buildCreateOrderBody(
      baseCreateInput({ payment: { status: 'paid', method: 'bank', cashOnDeliveryFee: 10, cashOnDeliveryCurrency: 'SAR' } }),
    );
    expect(body['payment']).toEqual({ status: 'paid', method: 'bank' });
  });

  it('sends the accepted method as an array', () => {
    const body = sallaOrders.buildCreateOrderBody(
      baseCreateInput({ payment: { status: 'pending_payment', acceptedMethod: ' credit_card ' } }),
    );
    expect(body['payment']).toEqual({ status: 'pending_payment', accepted_methods: ['credit_card'] });
  });
});

describe('createOrder', () => {
  function mockCreateOrder({ currency }: { currency: string }) {
    return vi.spyOn(httpClient, 'sendRequest').mockImplementation(async (request: HttpRequest) => {
      if (new URL(request.url).pathname.endsWith('/store/info')) {
        return { status: 200, headers: {}, body: { data: { id: 1, currency } } };
      }
      return { status: 200, headers: {}, body: { data: { id: 7, reference_id: 1001 } } };
    });
  }

  function pathsOf(spy: ReturnType<typeof mockCreateOrder>): string[] {
    return spy.mock.calls.map(([request]) => new URL(request.url).pathname.replace('/admin/v2', ''));
  }

  it('reads the store currency for cash on delivery and sends it in the body', async () => {
    const spy = mockCreateOrder({ currency: ' SAR ' });
    await sallaOrders.createOrder({ auth, input: baseCreateInput({ payment: { status: 'paid', method: 'cod' } }) });
    expect(pathsOf(spy)).toEqual(['/store/info', '/orders']);
    const createRequest = spy.mock.calls[1][0];
    expect(createRequest.method).toBe(HttpMethod.POST);
    expect(createRequest.body).toMatchObject({ payment: { status: 'paid', method: 'cod', cash_on_delivery: { amount: 0, currency: 'SAR' } } });
  });

  it('does not read the store currency for other payment methods', async () => {
    const spy = mockCreateOrder({ currency: 'SAR' });
    await sallaOrders.createOrder({ auth, input: baseCreateInput({ payment: { status: 'paid', method: 'bank', cashOnDeliveryFee: 5 } }) });
    expect(pathsOf(spy)).toEqual(['/orders']);
    expect(spy.mock.calls[0][0].body).toMatchObject({ payment: { status: 'paid', method: 'bank' } });
    expect(JSON.stringify(spy.mock.calls[0][0].body)).not.toContain('cash_on_delivery');
  });
});

describe('buildUpdateOrderBody and updateOrder', () => {
  it('sends ship_to.geo_coordinates.lng (Update Order spelling)', () => {
    const body = sallaOrders.buildUpdateOrderBody({ shipTo: { ...updateAddress, longitude: '46.6' } });
    expect(body['ship_to']).toEqual({ ...fullAddressBody, ...updateAddressExtras, geo_coordinates: { lat: 24.7136, lng: 46.6 } });
    expect(JSON.stringify(body)).not.toContain('"lang"');
  });

  it('applies the Create Order address checks plus the two National Address numbers', () => {
    expect(() => sallaOrders.buildUpdateOrderBody({ shipTo: { ...updateAddress, latitude: undefined } })).toThrow(
      'Give both latitude and longitude',
    );
    expect(() => sallaOrders.buildUpdateOrderBody({ shipTo: { ...updateAddress, addressLine: '' } })).toThrow('missing: address_line.');
    expect(() => sallaOrders.buildUpdateOrderBody({ shipTo: fullAddress })).toThrow('missing: building_number, additional_number.');
    expect(() => sallaOrders.buildCreateOrderBody(baseCreateInput({ shipTo: fullAddress }))).not.toThrow();
    expect(sallaOrders.buildUpdateOrderBody({ shipTo: { postalCode: ' ' } })).toEqual({});
  });

  it('compacts empty values and returns {} for an empty input', () => {
    expect(sallaOrders.buildUpdateOrderBody({})).toEqual({});
    expect(
      sallaOrders.buildUpdateOrderBody({
        customer: { name: ' ', email: '' },
        payment: { status: '', acceptedMethods: [] },
        receiver: {},
        couponCode: ' ',
        employeeIds: [],
        shipTo: {},
      }),
    ).toEqual({});
  });

  it('converts IDs to numbers', () => {
    expect(
      sallaOrders.buildUpdateOrderBody({
        customer: { id: '15' },
        courierId: '9',
        branchId: 4,
        employeeIds: ['7', 8],
        payment: { status: 'paid', storeBankId: '3', acceptedMethods: ['bank'] },
      }),
    ).toEqual({
      customer: { id: 15 },
      courier_id: 9,
      branch_id: 4,
      employees: [7, 8],
      payment: { status: 'paid', store_bank_id: 3, accepted_methods: ['bank'] },
    });
    expect(() => sallaOrders.buildUpdateOrderBody({ employeeIds: ['x'] })).toThrow('Employee ID must be a numeric Salla ID');
  });

  it('updateOrder refuses an empty update without calling Salla', async () => {
    const spy = vi.spyOn(httpClient, 'sendRequest');
    await expect(sallaOrders.updateOrder({ auth, orderId: 1, input: { couponCode: ' ' } })).rejects.toThrow('Nothing to update');
    expect(spy).not.toHaveBeenCalled();
  });

  it('updateOrder sends a PUT to the order', async () => {
    const spy = vi.spyOn(httpClient, 'sendRequest').mockResolvedValue({ status: 200, headers: {}, body: { data: { id: 1 } } });
    await sallaOrders.updateOrder({ auth, orderId: '1', input: { couponCode: 'SAVE10' } });
    const sent = spy.mock.calls[0][0];
    expect(sent.method).toBe(HttpMethod.PUT);
    expect(sent.url).toBe('https://api.salla.dev/admin/v2/orders/1');
    expect(sent.body).toEqual({ coupon_code: 'SAVE10' });
  });

  it('sends cash_on_delivery with amount 0 and the currency when the new method is cash on delivery without a fee', () => {
    expect(sallaOrders.buildUpdateOrderBody({ payment: { method: 'cod', cashOnDeliveryCurrency: 'SAR' } })).toEqual({
      payment: { method: 'cod', cash_on_delivery: { amount: 0, currency: 'SAR' } },
    });
  });

  it('sends the cash on delivery fee with the currency', () => {
    expect(sallaOrders.buildUpdateOrderBody({ payment: { method: 'cod', cashOnDeliveryFee: '12.5', cashOnDeliveryCurrency: 'SAR' } })).toEqual({
      payment: { method: 'cod', cash_on_delivery: { amount: 12.5, currency: 'SAR' } },
    });
  });

  it('throws when the new method is cash on delivery and there is no currency', () => {
    expect(() => sallaOrders.buildUpdateOrderBody({ payment: { method: 'cod' } })).toThrow(
      'Could not read the store currency, which Salla needs for cash on delivery orders. Try again.',
    );
  });

  it('leaves cash_on_delivery out for other methods even when a fee is given', () => {
    expect(sallaOrders.buildUpdateOrderBody({ payment: { method: 'bank', cashOnDeliveryFee: 10, cashOnDeliveryCurrency: 'SAR' } })).toEqual({
      payment: { method: 'bank' },
    });
  });

  function mockUpdateOrder({ currency }: { currency: string }) {
    return vi.spyOn(httpClient, 'sendRequest').mockImplementation(async (request: HttpRequest) => {
      if (new URL(request.url).pathname.endsWith('/store/info')) {
        return { status: 200, headers: {}, body: { data: { id: 1, currency } } };
      }
      return { status: 200, headers: {}, body: { data: { id: 1 } } };
    });
  }

  it('updateOrder reads the store currency when the new method is cash on delivery and sends it in the body', async () => {
    const spy = mockUpdateOrder({ currency: 'SAR' });
    await sallaOrders.updateOrder({ auth, orderId: '1', input: { payment: { method: 'cod', cashOnDeliveryFee: 5 } } });
    expect(spy.mock.calls.map(([request]) => new URL(request.url).pathname.replace('/admin/v2', ''))).toEqual(['/store/info', '/orders/1']);
    const sent = spy.mock.calls[1][0];
    expect(sent.method).toBe(HttpMethod.PUT);
    expect(sent.body).toEqual({ payment: { method: 'cod', cash_on_delivery: { amount: 5, currency: 'SAR' } } });
  });

  it('updateOrder does not read the store currency for other methods or when payment is not changed', async () => {
    const spy = mockUpdateOrder({ currency: 'SAR' });
    await sallaOrders.updateOrder({ auth, orderId: '1', input: { payment: { method: 'bank', cashOnDeliveryFee: 5 } } });
    await sallaOrders.updateOrder({ auth, orderId: '1', input: { couponCode: 'SAVE10' } });
    expect(spy.mock.calls.map(([request]) => new URL(request.url).pathname.replace('/admin/v2', ''))).toEqual(['/orders/1', '/orders/1']);
    expect(spy.mock.calls[0][0].body).toEqual({ payment: { method: 'bank' } });
  });
});

describe('sendInvoice', () => {
  it('POSTs to send-invoice and returns the message', async () => {
    const spy = vi.spyOn(httpClient, 'sendRequest').mockResolvedValue({ status: 200, headers: {}, body: { data: { message: 'sent' } } });
    expect(await sallaOrders.sendInvoice({ auth, orderId: '7' })).toEqual({ order_id: 7, message: 'sent' });
    expect(spy.mock.calls[0][0]).toMatchObject({ method: HttpMethod.POST, url: 'https://api.salla.dev/admin/v2/orders/7/send-invoice' });
  });

  it('explains in English that only Completed orders get an invoice and keeps the Salla message', async () => {
    vi.spyOn(httpClient, 'sendRequest').mockRejectedValue(
      new HttpError({}, { status: 422, responseBody: { error: { message: 'يجب أن تكون حالة الطلب مكتمل' } } }),
    );
    const attempt = sallaOrders.sendInvoice({ auth, orderId: 7 });
    await expect(attempt).rejects.toThrow(
      'Salla refused to send the invoice. It sends invoices only for orders whose status is Completed, so check the status of order 7. Salla said: يجب أن تكون حالة الطلب مكتمل',
    );
    await expect(attempt).rejects.toThrow('يجب أن تكون حالة الطلب مكتمل');
  });

  it('passes other errors through unchanged', async () => {
    vi.spyOn(httpClient, 'sendRequest').mockRejectedValue(new HttpError({}, { status: 404, responseBody: { error: { message: 'Not found' } } }));
    await expect(sallaOrders.sendInvoice({ auth, orderId: 7 })).rejects.toThrow('Salla API error (404): Not found');
  });
});

describe('addOrderNote', () => {
  it('keeps a history ID that is too large for a number exact, as text', async () => {
    const spy = vi.spyOn(httpClient, 'sendRequest').mockResolvedValue({
      status: 201,
      headers: {},
      body: '{"status":201,"data":{"id": 3506120883028506601,"note":"id: 9999999999999999999","customized":{"id":857090988},"created_at":{"date":"2026-11-12 16:33:14.000000","timezone":"Asia/Riyadh"}}}',
    });
    const entry = await sallaOrders.addOrderNote({ auth, orderId: 7, note: ' Packed ' });
    expect(spy.mock.calls[0][0]).toMatchObject({ method: HttpMethod.POST, responseType: 'text', body: { note: 'Packed' } });
    expect(entry['id']).toBe('3506120883028506601');
    expect(entry['note']).toBe('id: 9999999999999999999');
    expect(entry['customized']).toEqual({ id: 857090988 });
    expect(entry['created_at_iso']).toBe('2026-11-12T13:33:14.000Z');
  });

  it('returns a small history ID as text too', async () => {
    vi.spyOn(httpClient, 'sendRequest').mockResolvedValue({ status: 201, headers: {}, body: '{"data":{"id":42,"note":"Packed"}}' });
    const entry = await sallaOrders.addOrderNote({ auth, orderId: 7, note: 'Packed' });
    expect(entry['id']).toBe('42');
    expect(entry).not.toHaveProperty('created_at_iso');
  });

  it('reads the Salla error message from a text error body', async () => {
    vi.spyOn(httpClient, 'sendRequest').mockRejectedValue(
      new HttpError({}, { status: 404, responseBody: '{"status":404,"success":false,"error":{"message":"Order not found"}}' }),
    );
    await expect(sallaOrders.addOrderNote({ auth, orderId: 7, note: 'Packed' })).rejects.toThrow('Salla API error (404): Order not found');
  });
});
