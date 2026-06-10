import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { qawafelAuth, QawafelAuth } from '../common/auth';
import { qawafelApiCall } from '../common/client';
import {
  ALL_TRANSITIONS_FALLBACK,
  qawafelProps,
  TRANSITIONS_BY_STATE,
} from '../common/props';

export const updateOrderStatus = createAction({
  auth: qawafelAuth,
  name: 'update_order_status',
  displayName: 'Update Order Status',
  description:
    'Move an order forward in the Qawafel fulfilment workflow. Qawafel enforces a strict state machine — for example, an order must be **Out for Delivery** before it can be marked **Delivered**. To cancel an order, use the **Cancel Order** action instead.',
  props: {
    order_id: Property.ShortText({
      displayName: 'Order ID',
      description:
        'The Qawafel order ID (starts with `ord_`). Get it from a webhook trigger, "List Orders", or your dashboard. Once you fill this in, the dropdown below only shows transitions valid for this order\'s current state.',
      required: true,
    }),
    transition: Property.Dropdown({
      auth: qawafelAuth,
      displayName: 'New Status',
      description:
        "Pick the next status. Only states reachable from the order's current state appear here. Workflow: Pending → Confirmed → Ready for Pickup → Out for Delivery → Delivered → Fulfilled.",
      required: true,
      refreshers: ['order_id'],
      options: async ({ auth, order_id }) => {
        if (!auth) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Connect your Qawafel account first',
          };
        }
        const orderIdValue = order_id || '';
        if (!orderIdValue || orderIdValue) {
          return {
            disabled: false,
            options: ALL_TRANSITIONS_FALLBACK,
            placeholder:
              "Order ID is dynamic — pick the transition manually. Qawafel will reject moves that are not valid from the order's current state.",
          };
        }
        try {
          const response = await qawafelApiCall<{ state: string }>({
            auth: auth as QawafelAuth,
            method: HttpMethod.GET,
            path: `/orders/${orderIdValue}`,
          });
          const currentState = response.body.state;
          const validTransitions = TRANSITIONS_BY_STATE[currentState] ?? [];
          if (validTransitions.length === 0) {
            return {
              disabled: true,
              options: [],
              placeholder: `Order is in state "${currentState}" — no forward transitions available. Use Cancel Order if needed.`,
            };
          }
          return {
            disabled: false,
            options: validTransitions,
          };
        } catch {
          return {
            disabled: false,
            options: ALL_TRANSITIONS_FALLBACK,
            placeholder:
              'Could not load the order. Pick a transition manually — Qawafel will reject invalid moves.',
          };
        }
      },
    }),
    reason: Property.LongText({
      displayName: 'Reason (only used when marking Not Delivered)',
      description:
        'Required when **New Status** is "Mark Not Delivered" — explains why delivery failed (max 500 characters). Ignored for all other transitions.',
      required: false,
    }),
    idempotency_key: qawafelProps.idempotencyKey,
  },
  async run({ auth, propsValue }) {
    const transition = propsValue.transition;
    const body =
      transition === 'not-delivered' && propsValue.reason
        ? { reason: propsValue.reason }
        : undefined;

    const response = await qawafelApiCall({
      auth,
      method: HttpMethod.POST,
      path: `/orders/${propsValue.order_id}/${transition}`,
      body,
      idempotencyKey: propsValue.idempotency_key,
    });
    return response.body;
  },
});
