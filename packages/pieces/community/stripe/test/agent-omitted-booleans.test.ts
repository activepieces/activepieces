/// <reference types="vitest/globals" />

const { sendRequest } = vi.hoisted(() => ({ sendRequest: vi.fn() }));

vi.mock('@activepieces/pieces-common', async (importOriginal) => {
  const actual = await importOriginal<
    typeof import('@activepieces/pieces-common')
  >();
  return {
    ...actual,
    httpClient: {
      sendRequest: (...args: unknown[]) => sendRequest(...args),
    },
  };
});

vi.mock('../src/index', () => ({ stripeAuth: { type: 'SECRET_TEXT' } }));

import {
  Action,
  AppConnectionType,
  createMockActionContext,
  InputProperty,
  InputPropertyMap,
  PropertyType,
} from '@activepieces/pieces-framework';
import { stripeUpdateProduct } from '../src/lib/actions/update-product';
import { stripeUpdatePrice } from '../src/lib/actions/update-price';
import { stripeUpdateSubscription } from '../src/lib/actions/update-subscription';
import { stripeFinalizeInvoice } from '../src/lib/actions/finalize-invoice';
import { stripeCreateProductAi } from '../src/lib/actions/create-product-ai';
import { stripeCreatePromotionCode } from '../src/lib/actions/create-promotion-code';
import { stripeCapturePaymentIntent } from '../src/lib/actions/capture-payment-intent';

const auth: { type: AppConnectionType.SECRET_TEXT; secret_text: string } = {
  type: AppConnectionType.SECRET_TEXT,
  secret_text: 'sk_test_dummy',
};

const sentBody = () => sendRequest.mock.calls.at(-1)?.[0].body;
const sentUrl = () => sendRequest.mock.calls.at(-1)?.[0].url;

function fillLikeAgentPath({
  action,
  input,
}: {
  action: Action;
  input: Record<string, unknown>;
}): Record<string, unknown> {
  const defaults: Record<string, unknown> = {};
  for (const [name, prop] of Object.entries<InputProperty>(action.props)) {
    if (prop.required) continue;
    if (prop.type === PropertyType.CHECKBOX) {
      defaults[name] = prop.defaultValue ?? false;
    } else if (prop.type === PropertyType.ARRAY) {
      defaults[name] = [];
    } else if (prop.type === PropertyType.DYNAMIC) {
      defaults[name] = {};
    }
  }
  return { ...defaults, ...input };
}

function runAction({
  action,
  propsValue,
}: {
  action: Action;
  propsValue: Record<string, unknown>;
}) {
  sendRequest.mockResolvedValueOnce({ body: {} });
  return action.run({
    ...createMockActionContext<InputPropertyMap>({ propsValue }),
    auth,
    propsValue,
  });
}

function runLikeAgent({
  action,
  input,
}: {
  action: Action;
  input: Record<string, unknown>;
}) {
  return runAction({
    action,
    propsValue: fillLikeAgentPath({ action, input }),
  });
}

function optionalCheckboxes({ action }: { action: Action }): string[] {
  return Object.entries<InputProperty>(action.props)
    .filter(([, prop]) => prop.type === PropertyType.CHECKBOX && !prop.required)
    .map(([name]) => name);
}

beforeEach(() => sendRequest.mockReset());

describe('fields the agent path would fill with false', () => {
  test.each([
    ['update_product', stripeUpdateProduct],
    ['update_price', stripeUpdatePrice],
    ['update_subscription', stripeUpdateSubscription],
    ['finalize_invoice', stripeFinalizeInvoice],
  ])('%s has no optional Checkbox', (_name, action) => {
    expect(optionalCheckboxes({ action })).toEqual([]);
  });
});

describe('an agent call that leaves the boolean out', () => {
  test('renaming a product does not archive it', async () => {
    await runLikeAgent({
      action: stripeUpdateProduct,
      input: {
        product_id: 'prod_1',
        name: 'New name',
      },
    });

    expect(sentUrl()).toBe('https://api.stripe.com/v1/products/prod_1');
    expect(sentBody()).toEqual({ name: 'New name' });
  });

  test('changing a price nickname does not archive the price', async () => {
    await runLikeAgent({
      action: stripeUpdatePrice,
      input: {
        price_id: 'price_1',
        nickname: 'Monthly',
      },
    });

    expect(sentBody()).toEqual({ nickname: 'Monthly' });
  });

  test('updating subscription metadata keeps a scheduled cancellation', async () => {
    await runLikeAgent({
      action: stripeUpdateSubscription,
      input: {
        subscription_id: 'sub_1',
        metadata: { plan: 'gold' },
      },
    });

    expect(sentBody()).toEqual({ 'metadata[plan]': 'gold' });
  });

  test('finalizing an invoice keeps its automatic collection setting', async () => {
    await runLikeAgent({
      action: stripeFinalizeInvoice,
      input: { invoice_id: 'in_1' },
    });

    expect(sentUrl()).toBe('https://api.stripe.com/v1/invoices/in_1/finalize');
    expect(sentBody()).toEqual({});
  });

  test('a new product is created active', async () => {
    await runLikeAgent({
      action: stripeCreateProductAi,
      input: { name: 'Widget' },
    });

    expect(sentBody()).toEqual({ name: 'Widget', active: true });
  });

  test('a new promotion code is created active', async () => {
    await runLikeAgent({
      action: stripeCreatePromotionCode,
      input: { coupon: 'SUMMER' },
    });

    expect(sentBody()).toEqual({ coupon: 'SUMMER', active: true });
  });

  test('a capture does not send final_capture, so it works without multicapture', async () => {
    await runLikeAgent({
      action: stripeCapturePaymentIntent,
      input: {
        payment_intent_id: 'pi_1',
      },
    });

    expect(sentBody()).toEqual({});
  });
});

describe('an agent call that sets the boolean', () => {
  test('Leave unchanged sends nothing for that field', async () => {
    await runLikeAgent({
      action: stripeUpdateProduct,
      input: {
        product_id: 'prod_1',
        name: 'New name',
        active: 'unchanged',
      },
    });
    expect(sentBody()).toEqual({ name: 'New name' });

    await runLikeAgent({
      action: stripeUpdateSubscription,
      input: {
        subscription_id: 'sub_1',
        cancel_at_period_end: 'unchanged',
      },
    });
    expect(sentBody()).toEqual({});
  });

  test('No archives a product or price and Yes restores it', async () => {
    await runLikeAgent({
      action: stripeUpdateProduct,
      input: {
        product_id: 'prod_1',
        active: 'no',
      },
    });
    expect(sentBody()).toEqual({ active: false });

    await runLikeAgent({
      action: stripeUpdatePrice,
      input: { price_id: 'price_1', active: 'yes' },
    });
    expect(sentBody()).toEqual({ active: true });
  });

  test('Yes schedules a cancellation and No removes it', async () => {
    await runLikeAgent({
      action: stripeUpdateSubscription,
      input: {
        subscription_id: 'sub_1',
        cancel_at_period_end: 'yes',
      },
    });
    expect(sentBody()).toEqual({ cancel_at_period_end: true });

    await runLikeAgent({
      action: stripeUpdateSubscription,
      input: {
        subscription_id: 'sub_1',
        cancel_at_period_end: 'no',
      },
    });
    expect(sentBody()).toEqual({ cancel_at_period_end: false });
  });

  test('auto_advance Yes and No are sent on finalize', async () => {
    await runLikeAgent({
      action: stripeFinalizeInvoice,
      input: {
        invoice_id: 'in_1',
        auto_advance: 'no',
      },
    });
    expect(sentBody()).toEqual({ auto_advance: false });

    await runLikeAgent({
      action: stripeFinalizeInvoice,
      input: {
        invoice_id: 'in_1',
        auto_advance: 'yes',
      },
    });
    expect(sentBody()).toEqual({ auto_advance: true });
  });

  test('an explicit false still creates an inactive product or promotion code', async () => {
    await runLikeAgent({
      action: stripeCreateProductAi,
      input: { name: 'Widget', active: false },
    });
    expect(sentBody()).toEqual({ name: 'Widget', active: false });

    await runLikeAgent({
      action: stripeCreatePromotionCode,
      input: {
        coupon: 'SUMMER',
        active: false,
      },
    });
    expect(sentBody()).toEqual({ coupon: 'SUMMER', active: false });
  });

  test('an explicit final_capture false keeps the rest capturable', async () => {
    await runLikeAgent({
      action: stripeCapturePaymentIntent,
      input: {
        payment_intent_id: 'pi_1',
        final_capture: false,
      },
    });

    expect(sentBody()).toEqual({ final_capture: false });
  });
});

describe('values saved by Stripe 0.9.0 and earlier', () => {
  test('booleans still map to true and false', async () => {
    await runAction({
      action: stripeUpdateProduct,
      propsValue: { product_id: 'prod_1', active: true },
    });
    expect(sentBody()).toEqual({ active: true });

    await runAction({
      action: stripeUpdateSubscription,
      propsValue: {
        subscription_id: 'sub_1',
        cancel_at_period_end: false,
      },
    });
    expect(sentBody()).toEqual({ cancel_at_period_end: false });
  });
});
