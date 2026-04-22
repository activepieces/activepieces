import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-framework';
import { ninjapipeAuth } from '../auth';
import { RESOURCE_CONFIG, RESOURCE_OPTIONS } from '../common/constants';
import { ninjapipeApiRequest, getAllPages } from '../common/client';
import { extractItems, flattenCustomFields, buildPairObject } from '../common/helpers';

export const listRecords = createAction({
  auth: ninjapipeAuth,
  name: 'list_records',
  displayName: 'List Records',
  description: 'List records from NinjaPipe with pagination and filters',
  props: {
    resource: Property.StaticDropdown({
      displayName: 'Resource',
      required: true,
      options: { options: RESOURCE_OPTIONS },
    }),
    returnAll: Property.Checkbox({
      displayName: 'Return All',
      description: 'Return all results through pagination',
      required: false,
      defaultValue: false,
    }),
    page: Property.Number({
      displayName: 'Page',
      description: 'Page number (default: 1)',
      required: false,
      defaultValue: 1,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Results per page (default: 100)',
      required: false,
      defaultValue: 100,
    }),
    search: Property.ShortText({
      displayName: 'Search',
      description: 'Search query',
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
    queryParams: Property.Array({
      displayName: 'Query Parameters',
      required: false,
      properties: {
        field: Property.ShortText({ displayName: 'Field Name', required: true }),
        type: Property.StaticDropdown({
          displayName: 'Type',
          required: true,
          options: {
            options: [
              { label: 'String', value: 'string' },
              { label: 'Number', value: 'number' },
              { label: 'Boolean', value: 'boolean' },
              { label: 'JSON', value: 'json' },
              { label: 'Null', value: 'null' },
            ],
          },
        }),
        value: Property.ShortText({ displayName: 'Value', required: true }),
      },
    }),
    advancedQueryJson: Property.Json({
      displayName: 'Advanced Query (JSON)',
      description: 'Complex query as JSON object',
      required: false,
    }),
    flattenCustomFields: Property.Checkbox({
      displayName: 'Flatten Custom Fields',
      description: 'Flatten custom_fields object to top-level',
      required: false,
      defaultValue: true,
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
      page: propsValue.page ?? 1,
      limit: propsValue.limit ?? 100,
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

    const queryParams = propsValue.queryParams as Array<{ field: string; type: string; value: string }> | undefined;
    if (queryParams && queryParams.length > 0) {
      const parsed = buildPairObject(queryParams) as Record<string, unknown>;
      Object.assign(qs, parsed);
    }

    const advancedQuery = propsValue.advancedQueryJson as Record<string, unknown> | undefined;
    if (advancedQuery) {
      Object.assign(qs, advancedQuery);
    }

    let items: unknown[];

    if (propsValue.returnAll) {
      items = await getAllPages(
        auth as { base_url: string; api_key: string },
        config.path,
        1000,
        qs,
      );
    } else {
      const response = await ninjapipeApiRequest(
        auth as { base_url: string; api_key: string },
        HttpMethod.GET,
        config.path,
        undefined,
        qs,
      );
      items = extractItems(response);
    }

    if (propsValue.flattenCustomFields) {
      return items.map((item) => flattenCustomFields(item as Record<string, unknown>));
    }

    return items;
  },
});
