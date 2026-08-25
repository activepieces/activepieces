import { Property, createAction } from '@activepieces/pieces-framework';
import { onfleetAuth } from '../..';

import Onfleet from '@onfleet/node-onfleet';

export const getContainer = createAction({
  auth: onfleetAuth,
  name: 'get_container',
  displayName: 'Get Container',
  description: 'Get a specific container',
  audience: 'both',
  aiMetadata: {
    description:
      'Fetch an Onfleet container (the ordered task queue) for a given owner, specifying both the container type (organization, team, or worker) and that owner ID. Read-only and idempotent. Use to inspect the current task ordering for an org, team, or worker.',
    idempotent: true,
  },
  props: {
    containerType: Property.Dropdown<
      'organizations' | 'workers' | 'teams',
      true,
      typeof onfleetAuth
    >({
      displayName: 'Container Type',  
      auth: onfleetAuth,
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
    const onfleetApi = new Onfleet(context.auth.secret_text);

    return await onfleetApi.containers.get(
      context.propsValue.containerId,
      context.propsValue.containerType
    );
  },
});
