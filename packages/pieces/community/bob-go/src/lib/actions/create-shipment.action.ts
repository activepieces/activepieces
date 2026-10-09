import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { bobGoAuth } from '../auth';
import { bobGoRequest } from '../common/client';

export const createShipmentAction = createAction({
  auth: bobGoAuth,
  name: 'create_shipment',
  displayName: 'Create Shipment',
  description: 'Book a courier via Bob Go and get a waybill.',
  props: {
    reference: Property.ShortText({ displayName: 'Reference', required: true }),
    courier_code: Property.ShortText({
      displayName: 'Courier Code',
      description: 'e.g. TCGCG, ARAMEX. Get these from Get Quotes.',
      required: true,
    }),
    collection_address: Property.Json({ displayName: 'Collection Address', required: true }),
    delivery_address: Property.Json({ displayName: 'Delivery Address', required: true }),
    parcel: Property.Json({ displayName: 'Parcel (JSON)', required: true }),
    declared_value: Property.Number({
      displayName: 'Declared Value (ZAR)',
      required: false,
      defaultValue: 0,
    }),
  },
  async run({ auth, propsValue }) {
    return bobGoRequest<Record<string, unknown>>({
      auth: auth.props,
      method: HttpMethod.POST,
      path: '/shipments',
      body: {
        reference: propsValue.reference,
        courier_code: propsValue.courier_code,
        collection_address: propsValue.collection_address,
        delivery_address: propsValue.delivery_address,
        parcels: [propsValue.parcel],
        declared_value: propsValue.declared_value ?? 0,
      },
    });
  },
});
