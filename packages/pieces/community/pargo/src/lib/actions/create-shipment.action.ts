import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { pargoAuth } from '../auth';
import { pargoRequest } from '../common/client';

export const createShipmentAction = createAction({
  auth: pargoAuth,
  name: 'create_shipment',
  displayName: 'Create Shipment',
  description: 'Create a Pargo shipment to a pickup point.',
  props: {
    reference: Property.ShortText({ displayName: 'Reference', required: true }),
    pickup_point_id: Property.ShortText({
      displayName: 'Pickup Point ID',
      description: 'Get from List Pickup Points.',
      required: true,
    }),
    customer_name: Property.ShortText({ displayName: 'Customer Name', required: true }),
    customer_email: Property.ShortText({ displayName: 'Customer Email', required: true }),
    customer_phone: Property.ShortText({ displayName: 'Customer Phone', required: true }),
    parcel_weight_kg: Property.Number({ displayName: 'Parcel Weight (kg)', required: true }),
    declared_value: Property.Number({
      displayName: 'Declared Value (ZAR)',
      required: false,
      defaultValue: 0,
    }),
  },
  async run({ auth, propsValue }) {
    return pargoRequest<Record<string, unknown>>({
      auth: auth.props,
      method: HttpMethod.POST,
      path: '/shipments',
      body: {
        reference: propsValue.reference,
        pickup_point_id: propsValue.pickup_point_id,
        customer: {
          name: propsValue.customer_name,
          email: propsValue.customer_email,
          phone: propsValue.customer_phone,
        },
        parcel: {
          weight_kg: propsValue.parcel_weight_kg,
        },
        declared_value: propsValue.declared_value ?? 0,
      },
    });
  },
});
