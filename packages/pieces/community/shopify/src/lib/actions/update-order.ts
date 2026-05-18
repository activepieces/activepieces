import {
  Property,
  createAction,
} from '@activepieces/pieces-framework';
import { shopifyAuth } from '../..';
import { updateOrder } from '../common';
import { z } from 'zod';
import { propsValidation } from '@activepieces/pieces-common';

export const updateOrderAction = createAction({
  auth: shopifyAuth,
  name: 'update_order',
  displayName: 'Update Order',
  description: 'Update an existing order.',
  props: {
    id: Property.ShortText({
      displayName: 'Order',
      description: 'The ID of the order.',
      required: true,
    }),
    email: Property.ShortText({
      displayName: 'Email',
      required: false,
    }),
    phoneNumber: Property.ShortText({
      displayName: 'Phone Number',
      required: false,
    }),
    tags: Property.ShortText({
      displayName: 'Tags',
      description: 'A string of comma-separated tags for filtering and search',
      required: false,
    }),
    note: Property.ShortText({
      displayName: 'Note',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    await propsValidation.validateZod(propsValue, {
      email: z.string().email().optional(),
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
