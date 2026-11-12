import {
  Property,
  createAction,
} from '@activepieces/pieces-framework';
import { shopifyAuth } from '../..';
import { updateOrder } from '../common';
import * as z from 'zod/mini'
import { propsValidation } from '@activepieces/pieces-common';

export const updateOrderAction = createAction({
  auth: shopifyAuth,
  name: 'update_order',
  classification: 'WRITE',
  displayName: 'Update Order',
  description: 'Update an existing order.',
  audience: 'both',
  aiMetadata: { description: 'Update editable fields on an existing Shopify order by order ID (email, phone, tags, note). Use to amend order metadata; this does not change line items, fulfillment, or payment. Sets absolute field values, so re-running with the same input is idempotent.', idempotent: true },
  propertyGroups: [
    {
      key: 'order',
      display: 'section',
      label: 'Order to update',
      icon: 'inbox',
      props: ['id'],
    },
    {
      key: 'changes',
      display: 'section',
      label: 'Changes',
      icon: 'sliders',
      props: ['changes_info', 'email', 'phoneNumber', 'tags', 'note'],
    },
  ],
  props: {
    id: Property.ShortText({
      displayName: 'Order ID',
      description: "From the order's URL in Shopify admin, not its #1001 number.",
      placeholder: '1234567890',
      required: true,
    }),
    changes_info: Property.MarkDown({
      value: 'Empty fields keep their current value.',
    }),
    email: Property.ShortText({
      displayName: 'Email',
      placeholder: 'jane@example.com',
      required: false,
      width: 'half',
    }),
    phoneNumber: Property.ShortText({
      displayName: 'Phone Number',
      description: 'Include the country code.',
      placeholder: '+15145550123',
      required: false,
      width: 'half',
    }),
    tags: Property.ShortText({
      displayName: 'Tags',
      description: 'Replaces the current tags. Separate them with commas.',
      placeholder: 'sale, summer',
      required: false,
    }),
    note: Property.ShortText({
      displayName: 'Note',
      description: 'Replaces the current note.',
      placeholder: 'Leave at the back door',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    await propsValidation.validateZod(propsValue, {
      email: z.optional(z.string().check(z.email())),
    });

    const { id, email, phoneNumber, tags, note } = propsValue;

    return await updateOrder(
      +id,
      {
        email,
        phone: phoneNumber,
        tags,
        note,
      },
      auth
    );
  },
});
