import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { uberDirectAuth } from '../auth';
import { uberDirectRequest } from '../common/client';

export const createDeliveryAction = createAction({
  auth: uberDirectAuth,
  name: 'create_delivery',
  displayName: 'Create Delivery',
  description: 'Create an on-demand delivery via Uber Direct.',
  props: {
    reference: Property.ShortText({ displayName: 'External Reference', required: true }),
    pickup_name: Property.ShortText({ displayName: 'Pickup Name', required: true }),
    pickup_address: Property.ShortText({ displayName: 'Pickup Address', required: true }),
    pickup_phone: Property.ShortText({ displayName: 'Pickup Phone', required: false }),
    dropoff_name: Property.ShortText({ displayName: 'Dropoff Name', required: true }),
    dropoff_address: Property.ShortText({ displayName: 'Dropoff Address', required: true }),
    dropoff_phone: Property.ShortText({ displayName: 'Dropoff Phone', required: false }),
    dropoff_notes: Property.ShortText({ displayName: 'Dropoff Notes', required: false }),
    manifest_description: Property.ShortText({
      displayName: 'Item Description',
      required: true,
    }),
    manifest_quantity: Property.Number({
      displayName: 'Item Quantity',
      required: false,
      defaultValue: 1,
    }),
    manifest_value_cents: Property.Number({
      displayName: 'Item Value (cents)',
      description: 'For example 10000 = R100.00',
      required: false,
      defaultValue: 0,
    }),
    pickup_ready_dt: Property.ShortText({
      displayName: 'Pickup Ready Date/Time (ISO)',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    return uberDirectRequest<Record<string, unknown>>({
      auth: auth.props,
      method: HttpMethod.POST,
      path: '/deliveries',
      body: {
        external_id: propsValue.reference,
        pickup: {
          name: propsValue.pickup_name,
          address: propsValue.pickup_address,
          phone_number: propsValue.pickup_phone,
        },
        dropoff: {
          name: propsValue.dropoff_name,
          address: propsValue.dropoff_address,
          phone_number: propsValue.dropoff_phone,
          notes: propsValue.dropoff_notes,
        },
        manifest: {
          description: propsValue.manifest_description,
          quantity: propsValue.manifest_quantity ?? 1,
          value: propsValue.manifest_value_cents ?? 0,
        },
        pickup_ready_dt: propsValue.pickup_ready_dt,
      },
    });
  },
});
