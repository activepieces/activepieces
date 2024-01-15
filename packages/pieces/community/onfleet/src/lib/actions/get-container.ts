import { Property, createAction } from '@activepieces/pieces-framework';
import { onfleetAuth } from '../..';

import Onfleet from '@onfleet/node-onfleet';

export const getContainer = createAction({
  auth: onfleetAuth,
  name: 'get_container',
  displayName: 'Get Container',
  description: 'Get a specific container',
  props: {
    containerType: Property.Dropdown<
      'organizations' | 'workers' | 'teams',
      true
    >({
      displayName: 'Container Type',
      required: true,
      refreshers: [],
      options: async () => {
        return {
          options: [
            {
              label: 'Organizations',
              value: 'organizations',
            },
            {
              label: 'Teams',
              value: 'teams',
            },
            {
              label: 'Workers',
              value: 'workers',
            },
          ],
        };
      },
    }),
    containerId: Property.ShortText({
      displayName: 'Container ID',
      required: true,
    }),
  },
  async run(context) {
    const onfleetApi = new Onfleet(context.auth);

    return await onfleetApi.containers.get(
      context.propsValue.containerId,
      context.propsValue.containerType
    );
  },
});
