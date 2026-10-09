import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { courierGuyAuth } from '../auth';
import { courierGuyRequest } from '../common/client';

export const getRatesAction = createAction({
  auth: courierGuyAuth,
  name: 'get_rates',
  displayName: 'Get Rates',
  description: 'Get shipping rates for a collection → delivery pair.',
  props: {
    collection_postal_code: Property.ShortText({
      displayName: 'Collection Postal Code',
      required: true,
    }),
    delivery_postal_code: Property.ShortText({
      displayName: 'Delivery Postal Code',
      required: true,
    }),
    parcel_weight_kg: Property.Number({
      displayName: 'Parcel Weight (kg)',
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
      path: '/rates',
      body: {
        collection_postal_code: propsValue.collection_postal_code,
        delivery_postal_code: propsValue.delivery_postal_code,
        parcel_weight_kg: propsValue.parcel_weight_kg,
        declared_value: propsValue.declared_value ?? 0,
      },
    });
  },
});
