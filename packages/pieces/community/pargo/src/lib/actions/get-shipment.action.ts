import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { pargoAuth } from '../auth';
import { pargoRequest } from '../common/client';

export const getShipmentAction = createAction({
  auth: pargoAuth,
  name: 'get_shipment',
  displayName: 'Get Shipment',
  description: 'Fetch a Pargo shipment by tracking reference.',
  props: {
    tracking_reference: Property.ShortText({
      displayName: 'Tracking Reference',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    return pargoRequest<Record<string, unknown>>({
      auth: auth.props,
      method: HttpMethod.GET,
      path: `/shipments/${encodeURIComponent(String(propsValue.tracking_reference))}`,
    });
  },
});
