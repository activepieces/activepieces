import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { bobGoAuth } from '../auth';
import { bobGoRequest } from '../common/client';

export const getShipmentAction = createAction({
  auth: bobGoAuth,
  name: 'get_shipment',
  displayName: 'Get Shipment',
  description: 'Fetch a shipment by tracking reference.',
  props: {
    tracking_reference: Property.ShortText({
      displayName: 'Tracking Reference',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    return bobGoRequest<Record<string, unknown>>({
      auth: auth.props,
      method: HttpMethod.GET,
      path: `/shipments/${encodeURIComponent(String(propsValue.tracking_reference))}`,
    });
  },
});
