import { createAction, Property } from '@activepieces/pieces-framework';
import { digitalOceanAuth, DigitalOceanAuthValue } from '../common/auth';
import { digitalOceanApiCall, getAuthFromValue } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const getDroplet = createAction({
  auth: digitalOceanAuth,
  name: 'get_droplet',
  displayName: 'Get Droplet',
  description: 'Retrieve details about a specific Droplet.',
  props: {
    droplet_id: Property.Dropdown({
      displayName: 'Droplet',
      description: 'Select the Droplet to retrieve.',
      required: true,
      refreshers: [],
      auth: digitalOceanAuth,
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'Connect your account first',
            options: [],
          };
        }

        const response = await digitalOceanApiCall<{
          droplets: Array<{ id: number; name: string }>;
        }>({
          method: HttpMethod.GET,
          path: '/droplets',
          auth: getAuthFromValue(auth as DigitalOceanAuthValue),
          query: { per_page: 200 },
        });

        return {
          disabled: false,
          options: response.droplets.map((droplet) => ({
            label: droplet.name,
            value: droplet.id,
          })),
        };
      },
    }),
  },
  async run(context) {
    const { droplet_id } = context.propsValue;

    const response = await digitalOceanApiCall<{
      droplet: {
        id: number;
        name: string;
        memory: number;
        vcpus: number;
        disk: number;
        locked: boolean;
        status: string;
        created_at: string;
        features: string[];
        backup_ids: number[];
        snapshot_ids: number[];
        image: object;
        volume_ids: string[];
        size: object;
        size_slug: string;
        networks: object;
        region: object;
        tags: string[];
        vpc_uuid: string;
      };
    }>({
      method: HttpMethod.GET,
      path: `/droplets/${droplet_id}`,
      auth: getAuthFromValue(context.auth as DigitalOceanAuthValue),
    });

    return response;
  },
});
