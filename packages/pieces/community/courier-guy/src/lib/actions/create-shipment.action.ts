import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { courierGuyAuth } from '../auth';
import { courierGuyRequest } from '../common/client';

export const createShipmentAction = createAction({
  auth: courierGuyAuth,
  name: 'create_shipment',
  displayName: 'Create Shipment',
  description: 'Create a new shipment with The Courier Guy.',
  props: {
    reference: Property.ShortText({
      displayName: 'Reference',
      description: 'Your order or invoice reference.',
      required: true,
    }),
    service_level_code: Property.ShortText({
      displayName: 'Service Level Code',
      description: 'e.g. ECO, OVN, ONX. See Shiplogic docs.',
      required: true,
    }),
    collection_address: Property.Json({
      displayName: 'Collection Address',
      description: 'JSON: { company, street_address, local_area, city, zone, country, code }',
      required: true,
    }),
    delivery_address: Property.Json({
      displayName: 'Delivery Address',
      description: 'Same shape as collection address.',
      required: true,
    }),
    parcel: Property.Json({
      displayName: 'Parcel',
      description: 'JSON: { submitted_length_cm, submitted_width_cm, submitted_height_cm, submitted_weight_kg }',
      required: true,
    }),
    declared_value: Property.Number({
      displayName: 'Declared Value (ZAR)',
      required: false,
      defaultValue: 0,
    }),
  },
  async run({ auth, propsValue }) {
    return courierGuyRequest<Record<string, unknown>>({
      auth: auth.props,
      method: HttpMethod.POST,
      path: '/shipments',
      body: {
        reference: propsValue.reference,
        service_level_code: propsValue.service_level_code,
        collection_address: propsValue.collection_address,
        delivery_address: propsValue.delivery_address,
        parcels: [propsValue.parcel],
        declared_value: propsValue.declared_value ?? 0,
      },
    });
  },
});
