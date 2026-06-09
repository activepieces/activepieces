import { createAction, Property } from '@activepieces/pieces-framework';
import { digitalOceanAuth, DigitalOceanAuthValue } from '../common/auth';
import { digitalOceanApiCall, getAuthFromValue } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const createDroplet = createAction({
  auth: digitalOceanAuth,
  name: 'create_droplet',
  displayName: 'Create Droplet',
  description: 'Create a new Droplet or multiple Droplets.',
  props: {
    creation_mode: Property.StaticDropdown({
      displayName: 'Creation Mode',
      description: 'Create a single Droplet or multiple Droplets at once.',
      required: true,
      defaultValue: 'single',
      options: {
        options: [
          { label: 'Single Droplet', value: 'single' },
          { label: 'Multiple Droplets (up to 10)', value: 'multiple' },
        ],
      },
    }),
    name: Property.ShortText({
      displayName: 'Droplet Name',
      description: 'Name for the Droplet (e.g., example.com).',
      required: true,
    }),
    names: Property.Array({
      displayName: 'Droplet Names',
      description: 'Names for multiple Droplets (up to 10).',
      required: true,
    }),
    region: Property.Dropdown({
      displayName: 'Region',
      description: 'Region to deploy the Droplet.',
      required: false,
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
          regions: Array<{ slug: string; name: string; available: boolean }>;
        }>({
          method: HttpMethod.GET,
          path: '/regions',
          auth: getAuthFromValue(auth as DigitalOceanAuthValue),
        });

        return {
          disabled: false,
          options: response.regions
            .filter((r) => r.available)
            .map((region) => ({
              label: region.name,
              value: region.slug,
            })),
        };
      },
    }),
    size: Property.Dropdown({
      displayName: 'Size',
      description: 'Droplet size (CPU, RAM, disk).',
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
          sizes: Array<{
            slug: string;
            description: string;
            memory: number;
            vcpus: number;
            disk: number;
            price_monthly: number;
            available: boolean;
          }>;
        }>({
          method: HttpMethod.GET,
          path: '/sizes',
          auth: getAuthFromValue(auth as DigitalOceanAuthValue),
        });

        return {
          disabled: false,
          options: response.sizes
            .filter((s) => s.available)
            .map((size) => ({
              label: `${size.description} ($${size.price_monthly}/mo)`,
              value: size.slug,
            })),
        };
      },
    }),
    image: Property.Dropdown({
      displayName: 'Image',
      description: 'Base image for the Droplet.',
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
          images: Array<{
            id: number;
            slug: string | null;
            name: string;
            distribution: string;
            public: boolean;
          }>;
        }>({
          method: HttpMethod.GET,
          path: '/images',
          auth: getAuthFromValue(auth as DigitalOceanAuthValue),
          query: { type: 'distribution', per_page: 200 },
        });

        return {
          disabled: false,
          options: response.images.map((image) => ({
            label: `${image.distribution} - ${image.name}`,
            value: image.slug ?? image.id,
          })),
        };
      },
    }),
    ssh_keys: Property.MultiSelectDropdown({
      displayName: 'SSH Keys',
      description: 'SSH keys to embed in the Droplet.',
      required: false,
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
          ssh_keys: Array<{ id: number; name: string; fingerprint: string }>;
        }>({
          method: HttpMethod.GET,
          path: '/account/keys',
          auth: getAuthFromValue(auth as DigitalOceanAuthValue),
        });

        return {
          disabled: false,
          options: response.ssh_keys.map((key) => ({
            label: key.name,
            value: key.id,
          })),
        };
      },
    }),
    vpc_uuid: Property.Dropdown({
      displayName: 'VPC',
      description: 'VPC network for the Droplet.',
      required: false,
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
          vpcs: Array<{ id: string; name: string; region: string }>;
        }>({
          method: HttpMethod.GET,
          path: '/vpcs',
          auth: getAuthFromValue(auth as DigitalOceanAuthValue),
        });

        return {
          disabled: false,
          options: response.vpcs.map((vpc) => ({
            label: `${vpc.name} (${vpc.region})`,
            value: vpc.id,
          })),
        };
      },
    }),
    backups: Property.Checkbox({
      displayName: 'Enable Backups',
      description: 'Enable automated backups.',
      required: false,
      defaultValue: false,
    }),
    ipv6: Property.Checkbox({
      displayName: 'Enable IPv6',
      description: 'Enable IPv6 networking.',
      required: false,
      defaultValue: false,
    }),
    monitoring: Property.Checkbox({
      displayName: 'Enable Monitoring',
      description: 'Install the DigitalOcean monitoring agent.',
      required: false,
      defaultValue: false,
    }),
    tags: Property.Array({
      displayName: 'Tags',
      description: 'Tags to apply to the Droplet.',
      required: false,
    }),
    user_data: Property.LongText({
      displayName: 'User Data',
      description: 'Cloud-init script or user data (max 64 KiB).',
      required: false,
    }),
    with_droplet_agent: Property.Checkbox({
      displayName: 'Install Droplet Agent',
      description: 'Install agent for web console access.',
      required: false,
      defaultValue: true,
    }),
  },
  async run(context) {
    const {
      creation_mode,
      name,
      names,
      region,
      size,
      image,
      ssh_keys,
      vpc_uuid,
      backups,
      ipv6,
      monitoring,
      tags,
      user_data,
      with_droplet_agent,
    } = context.propsValue;

    const body: Record<string, unknown> = {
      size,
      image,
    };

    if (creation_mode === 'single') {
      body['name'] = name;
    } else {
      body['names'] = names;
    }

    if (region) body['region'] = region;
    if (ssh_keys && ssh_keys.length > 0) body['ssh_keys'] = ssh_keys;
    if (vpc_uuid) body['vpc_uuid'] = vpc_uuid;
    if (backups !== undefined) body['backups'] = backups;
    if (ipv6 !== undefined) body['ipv6'] = ipv6;
    if (monitoring !== undefined) body['monitoring'] = monitoring;
    if (tags && tags.length > 0) body['tags'] = tags;
    if (user_data) body['user_data'] = user_data;
    if (with_droplet_agent !== undefined) body['with_droplet_agent'] = with_droplet_agent;

    const response = await digitalOceanApiCall<{
      droplet?: object;
      droplets?: object[];
      links: object;
    }>({
      method: HttpMethod.POST,
      path: '/droplets',
      auth: getAuthFromValue(context.auth as DigitalOceanAuthValue),
      body,
    });

    return response;
  },
});
