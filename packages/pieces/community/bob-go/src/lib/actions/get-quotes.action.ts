import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { bobGoAuth } from '../auth';
import { bobGoRequest } from '../common/client';

export const getQuotesAction = createAction({
  auth: bobGoAuth,
  name: 'get_quotes',
  displayName: 'Get Quotes',
  description: 'Compare courier rates for a collection → delivery pair.',
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
  },
  async run({ auth, propsValue }) {
    return bobGoRequest<Record<string, unknown>>({
      auth: auth.props,
      method: HttpMethod.POST,
      path: '/quotes',
      body: {
        collection_postal_code: propsValue.collection_postal_code,
        delivery_postal_code: propsValue.delivery_postal_code,
        parcel_weight_kg: propsValue.parcel_weight_kg,
      },
    });
  },
});
