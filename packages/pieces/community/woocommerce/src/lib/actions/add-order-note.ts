import { createAction, Property } from '@activepieces/pieces-framework';
import {
  AuthenticationType,
  HttpMethod,
  HttpRequest,
  httpClient,
} from '@activepieces/pieces-common';

import { wooAuth } from '../auth';
import { wooPathId } from '../common/path-id';
import { addOrderNoteOutputSchema } from '../output-schemas';

export const wooAddOrderNote = createAction({
  name: 'Add Order Note',
  classification: 'WRITE',
  displayName: 'Add Order Note',
  description: 'Add a note to an order, optionally visible to the customer',
  audience: 'human',
  aiMetadata: {
    description:
      'Adds a note to an existing WooCommerce order. A private note is visible only to store staff; a customer note is emailed to the customer and shown on the order page. Use when an agent needs to record why something happened on an order or communicate an update. Not idempotent: each call appends another note.',
    idempotent: false,
  },
  auth: wooAuth,
  outputSchema: addOrderNoteOutputSchema,
  propertyGroups: [
    {
      key: 'order',
      display: 'section',
      label: 'Order',
      icon: 'inbox',
      props: ['id'],
    },
    {
      key: 'note',
      display: 'section',
      label: 'Note to Add',
      icon: 'text',
      props: ['note', 'customer_note'],
    },
  ],
  props: {
    id: Property.ShortText({
      displayName: 'Order ID',
      description: 'The number after # in WooCommerce > Orders.',
      placeholder: '123',
      required: true,
    }),
    note: Property.LongText({
      displayName: 'Note',
      description: "Shown in the order's notes in WooCommerce.",
      required: true,
    }),
    customer_note: Property.Checkbox({
      displayName: 'Visible to Customer',
      description:
        'Email the note to the customer and show it on the order page',
      required: false,
      defaultValue: false,
    }),
  },
  async run(configValue) {
    const trimmedBaseUrl = configValue.auth.props.baseUrl.replace(/\/$/, '');
    const { id, note, customer_note } = configValue.propsValue;

    const request: HttpRequest = {
      method: HttpMethod.POST,
      url: `${trimmedBaseUrl}/wp-json/wc/v3/orders/${wooPathId.encode({ id, label: 'Order ID' })}/notes`,
      authentication: {
        type: AuthenticationType.BASIC,
        username: configValue.auth.props.consumerKey,
        password: configValue.auth.props.consumerSecret,
      },
      body: {
        note,
        customer_note: customer_note ?? false,
      },
    };

    const res = await httpClient.sendRequest(request);

    return res.body;
  },
});
