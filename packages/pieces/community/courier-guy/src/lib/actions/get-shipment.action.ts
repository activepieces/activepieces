import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { courierGuyAuth } from '../auth';
import { courierGuyRequest } from '../common/client';

export const getShipmentAction = createAction({
  auth: courierGuyAuth,
  name: 'get_shipment',
  displayName: 'Get Shipment',
  description: 'Fetch a shipment by its tracking reference.',
  props: {
    tracking_reference: Property.ShortText({
      displayName: 'Tracking Reference',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    return courierGuyRequest<Record<string, unknown>>({
      auth: auth.props,
      method: HttpMethod.GET,
      path: `/shipments/${encodeURIComponent(String(propsValue.tracking_reference))}`,
    });
  },
});
