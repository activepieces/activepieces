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

const LEGACY_CUSTOMER_FIELDS = { customer_name: 'Sara Alqahtani', customer_mobile: '+966501234567', customer_email: 'sara@example.com' };

function blankProps(props: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.keys(props).map((key) => [key, undefined]));
}

async function sentPut(run: () => Promise<unknown>): Promise<unknown> {
  const requests: HttpRequest[] = [];
  vi.spyOn(httpClient, 'sendRequest').mockImplementation(async (request: HttpRequest) => {
    requests.push(request);
    return { status: 200, headers: {}, body: { data: { id: 7 } } };
  });
  await run();
  return requests.find((request) => request.method === HttpMethod.PUT)?.body;
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('Update Order never sends customer details without a customer ID', () => {
  it('offers no customer name, mobile or email fields, which made Salla move the order to its visitor customer', () => {
    for (const props of [updateOrderAction.props, aiUpdateOrderAction.props]) {
      expect(Object.keys(props)).not.toContain('customer_name');
      expect(Object.keys(props)).not.toContain('customer_mobile');
      expect(Object.keys(props)).not.toContain('customer_email');
    }
  });

  it('ignores customer details left in an older flow and sends no customer object', async () => {
    const propsValue = { ...blankProps(updateOrderAction.props), ...LEGACY_CUSTOMER_FIELDS, order: '391872134', coupon_code: 'SAVE10' } as StaticPropsValue<
      typeof updateOrderAction.props
    >;
    const body = await sentPut(() => updateOrderAction.run({ ...createMockActionContext<typeof updateOrderAction.props>({ propsValue }), auth: AUTH }));
    expect(body).toEqual({ coupon_code: 'SAVE10' });
  });

  it('sends only the customer ID when moving the order to another customer', async () => {
    const propsValue = { ...blankProps(updateOrderAction.props), ...LEGACY_CUSTOMER_FIELDS, order: '391872134', customer: '1675660619' } as StaticPropsValue<
      typeof updateOrderAction.props
    >;
    const body = await sentPut(() => updateOrderAction.run({ ...createMockActionContext<typeof updateOrderAction.props>({ propsValue }), auth: AUTH }));
    expect(body).toEqual({ customer: { id: 1675660619 } });
  });

  it('AI Update Order sends only the customer ID too', async () => {
    const propsValue = { ...blankProps(aiUpdateOrderAction.props), ...LEGACY_CUSTOMER_FIELDS, order_id: 391872134, customer_id: 15 } as StaticPropsValue<
      typeof aiUpdateOrderAction.props
    >;
    const body = await sentPut(() => aiUpdateOrderAction.run({ ...createMockActionContext<typeof aiUpdateOrderAction.props>({ propsValue }), auth: AUTH }));
    expect(body).toEqual({ customer: { id: 15 } });
  });

  it('AI Update Order with only an email left over refuses to send an empty update', async () => {
    const propsValue = { ...blankProps(aiUpdateOrderAction.props), customer_email: 'sara@example.com', order_id: 391872134 } as StaticPropsValue<
      typeof aiUpdateOrderAction.props
    >;
    const spy = vi.spyOn(httpClient, 'sendRequest');
    await expect(
      aiUpdateOrderAction.run({ ...createMockActionContext<typeof aiUpdateOrderAction.props>({ propsValue }), auth: AUTH }),
    ).rejects.toThrow('Nothing to update');
    expect(spy).not.toHaveBeenCalled();
  });
});
