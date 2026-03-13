import { createAction, Property } from '@activepieces/pieces-framework';
import { digitalOceanAuth, DigitalOceanAuthValue } from '../common/auth';
import { digitalOceanApiCall, getAuthFromValue } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const listDroplets = createAction({
  auth: digitalOceanAuth,
  name: 'list_droplets',
  displayName: 'List All Droplets',
  description: 'Retrieve a list of all Droplets in your account.',
  props: {
    per_page: Property.Number({
      displayName: 'Results Per Page',
      description: 'Number of Droplets to return per page (1-200).',
      required: false,
      defaultValue: 20,
    }),
    page: Property.Number({
      displayName: 'Page',
      description: 'Which page of results to return.',
      required: false,
      defaultValue: 1,
    }),
    tag_name: Property.ShortText({
      displayName: 'Tag Name',
      description: 'Filter Droplets by a specific tag. Cannot be combined with Name or Type.',
      required: false,
    }),
    name: Property.ShortText({
      displayName: 'Name',
      description: 'Filter by exact Droplet name (case-insensitive). Cannot be combined with Tag Name.',
      required: false,
    }),
    type: Property.StaticDropdown({
      displayName: 'Type',
      description: 'Filter by Droplet type. Cannot be combined with Tag Name.',
      required: false,
      options: {
        options: [
          { label: 'Standard Droplets', value: 'droplets' },
          { label: 'GPU Droplets', value: 'gpus' },
        ],
      },
    }),
  },
  async run(context) {
    const { per_page, page, tag_name, name, type } = context.propsValue;

    const query: Record<string, string | number | boolean | undefined> = {
      per_page: per_page ?? 20,
      page: page ?? 1,
    };

    if (tag_name) {
      query['tag_name'] = tag_name;
    }
    if (name) {
      query['name'] = name;
    }
    if (type) {
      query['type'] = type;
    }

    const response = await digitalOceanApiCall<{
      droplets: Array<{
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
      }>;
      links: object;
      meta: { total: number };
    }>({
      method: HttpMethod.GET,
      path: '/droplets',
      auth: getAuthFromValue(context.auth as DigitalOceanAuthValue),
      query,
    });

    return response;
  },
});
