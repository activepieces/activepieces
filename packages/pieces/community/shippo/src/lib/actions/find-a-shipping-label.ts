import { createAction, Property } from '@activepieces/pieces-framework';
import { ShippoAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const findShippingLabel = createAction({
  auth: ShippoAuth,
  name: 'find_shipping_label',
  displayName: 'Find Shipping Label',
  description: 'Search for a shipping label (transaction) in Shippo using its ID',

  props: {
    label_id: Property.Dropdown({
      displayName: 'Shipping Label',
      description: 'Select a shipping label to retrieve',
      required: true,
      async options({ auth }) {
        if (!auth) {
          return {
            disabled: true,
            options: [],
          };
        }
        try {
          const data = await makeRequest(
            auth as string,
            HttpMethod.GET,
            '/transactions/'
          );

          const options = (data.results || []).map((txn: any) => ({
            label: `${txn.object_id} — ${txn.status || txn.object_status || 'Unknown'}`,
            value: txn.object_id,
          }));

          return {
            disabled: false,
            options,
          };
        } catch (error: any) {
          console.error('Error fetching transactions:', error);
          return {
            disabled: true,
            options: [],
          };
        }
      },
      refreshers: []
    }),
  },

  async run({ auth, propsValue }) {
    const { label_id } = propsValue;

    const label = await makeRequest(
      auth as string,
      HttpMethod.GET,
      `/transactions/${label_id}/`
    );

    return label;
  },
});
