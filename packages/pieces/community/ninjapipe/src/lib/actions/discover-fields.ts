import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-framework';
import { ninjapipeAuth } from '../auth';
import { RESOURCE_CONFIG, RESOURCE_OPTIONS } from '../common/constants';
import { ninjapipeApiRequest } from '../common/client';
import { extractItems, collectFieldMetadata } from '../common/helpers';

export const discoverFields = createAction({
  auth: ninjapipeAuth,
  name: 'discover_fields',
  displayName: 'Discover Fields',
  description: 'Discover fields from a sample record in NinjaPipe',
  props: {
    resource: Property.StaticDropdown({
      displayName: 'Resource',
      required: true,
      options: { options: RESOURCE_OPTIONS },
    }),
    limit: Property.Number({
      displayName: 'Sample Limit',
      description: 'Number of records to sample (default: 1)',
      required: false,
      defaultValue: 1,
    }),
    search: Property.ShortText({
      displayName: 'Search',
      description: 'Search query for sampling',
      required: false,
    }),
    statusFilter: Property.ShortText({
      displayName: 'Status Filter',
      required: false,
    }),
    ownerFilter: Property.ShortText({
      displayName: 'Owner Filter',
      description: 'Filter by owner ID',
      required: false,
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;
    const resource = propsValue.resource as string;
    const config = RESOURCE_CONFIG[resource];

    if (!config) {
      throw new Error(`Unknown resource: ${resource}`);
    }

    const qs: Record<string, unknown> = {
      page: 1,
      limit: propsValue.limit ?? 1,
    };

    if (propsValue.search) {
      qs.search = propsValue.search;
    }
    if (propsValue.statusFilter) {
      qs.status = propsValue.statusFilter;
    }
    if (propsValue.ownerFilter) {
      qs.owner_id = propsValue.ownerFilter;
    }

    const response = await ninjapipeApiRequest(
      auth as { base_url: string; api_key: string },
      HttpMethod.GET,
      config.path,
      undefined,
      qs,
    );

    const items = extractItems(response);
    const sample = items[0] as Record<string, unknown> | undefined;

    if (!sample) {
      return {
        resource,
        endpoint: config.path,
        recordCountSampled: 0,
        topLevelFields: [],
        customFieldKeys: [],
        sampleRecord: {},
      };
    }

    const topLevelFields = collectFieldMetadata(sample);
    const customFieldKeys = sample.custom_fields && typeof sample.custom_fields === 'object'
      ? Object.keys(sample.custom_fields as Record<string, unknown>)
      : [];

    return {
      resource,
      endpoint: config.path,
      recordCountSampled: items.length,
      topLevelFields,
      customFieldKeys,
      sampleRecord: sample,
    };
  },
});
