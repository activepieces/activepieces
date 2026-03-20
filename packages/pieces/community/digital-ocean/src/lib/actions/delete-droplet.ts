import { createAction, Property } from '@activepieces/pieces-framework';
import { digitalOceanAuth, DigitalOceanAuthValue } from '../common/auth';
import { digitalOceanApiCall, getAuthFromValue } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const deleteDroplet = createAction({
  auth: digitalOceanAuth,
  name: 'delete_droplet',
  displayName: 'Delete Droplet',
  description: 'Delete an existing Droplet.',
  props: {
    droplet_id: Property.Dropdown({
      displayName: 'Droplet',
      description: 'Select the Droplet to delete.',
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

    await digitalOceanApiCall<void>({
      method: HttpMethod.DELETE,
      path: `/droplets/${droplet_id}`,
      auth: getAuthFromValue(context.auth as DigitalOceanAuthValue),
    });

    return {
      success: true,
      message: `Droplet with ID '${droplet_id}' has been deleted.`,
    };
  },
});
