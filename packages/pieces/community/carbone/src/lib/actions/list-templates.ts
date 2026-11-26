import { carboneAuth } from '../auth';
import { Property, createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import {
  CarboneListResponse,
  CarboneTemplate,
  carboneClient,
  carboneOutputFields,
} from '../common/client';

export const listTemplatesAction = createAction({
  auth: carboneAuth,
  name: 'carbone_list_templates',
  classification: 'SEARCH',
  displayName: 'List Templates',
  description:
    'Retrieve a list of deployed Carbone templates with filtering and pagination.',
  audience: 'both',
  aiMetadata: {
    description: 'Lists deployed Carbone templates, optionally narrowed by template ID, version ID, category, or a fuzzy name search, with cursor-based pagination. Leaving all filters empty returns the first page of all templates; supplying a filter restricts to matches. Returns one page; pass nextCursor as Cursor while hasMore is true. Use to discover available templates or look up a template ID before rendering, updating, or deleting. Idempotent: read-only lookup.',
    idempotent: true,
  },
  outputSchema: {
    fields: [
      { key: 'templates', label: 'Templates', labelKey: 'name', listItems: carboneOutputFields.template },
      { key: 'count', label: 'Count', format: 'number' },
      { key: 'hasMore', label: 'Has More', format: 'boolean' },
      { key: 'nextCursor', label: 'Next Cursor' },
    ],
  },
  props: {
    id: Property.ShortText({
      displayName: 'Template ID Filter (optional)',
      required: false,
      description:
        'Filter by specific Template ID (64-bit format). Exact match.',
    }),
    versionId: Property.ShortText({
      displayName: 'Version ID Filter (optional)',
      required: false,
      description:
        'Filter by specific Version ID (SHA256 format). Exact match.',
    }),
    category: Property.ShortText({
      displayName: 'Category Filter (optional)',
      required: false,
      description:
        'Filter by category name.',
    }),
    search: Property.ShortText({
      displayName: 'Search (optional)',
      required: false,
      description:
        'Fuzzy search in template name, or exact match for ID/Version ID.',
    }),
    includeVersions: Property.Checkbox({
      displayName: 'Include All Versions',
      required: false,
      defaultValue: false,
      description:
        'If checked, returns all versions for a specific template ID (when ID filter is provided).',
    }),
    limit: Property.Number({
      displayName: 'Limit (optional)',
      required: false,
      description:
        'Maximum number of templates to return, 1 to 100. Default is 100.',
    }),
    cursor: Property.ShortText({
      displayName: 'Cursor (optional)',
      required: false,
      description:
        'Pagination cursor for fetching the next set of results.',
    }),
  },
  async run(context) {
    const { id, versionId, category, search, includeVersions, limit, cursor } =
      context.propsValue;

    const queryParams: Record<string, string> = {};
    const filters = { id, versionId, category, search };
    for (const [key, value] of Object.entries(filters)) {
      const trimmed = value?.trim();
      if (trimmed) queryParams[key] = trimmed;
    }
    if (includeVersions === true) queryParams['includeVersions'] = 'true';
    if (limit !== undefined && limit !== null) {
      if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
        throw new Error('Limit must be a whole number from 1 to 100.');
      }
      queryParams['limit'] = String(limit);
    }
    const trimmedCursor = cursor?.trim();
    if (trimmedCursor) queryParams['cursor'] = trimmedCursor;

    const response = await carboneClient.request<CarboneListResponse<CarboneTemplate>>({
      apiKey: context.auth.secret_text,
      method: HttpMethod.GET,
      path: '/templates',
      operation: 'list templates',
      queryParams,
    });
    const templates = response.body.data ?? [];
    return {
      templates,
      hasMore: response.body.hasMore === true,
      nextCursor: response.body.nextCursor ?? null,
      count: templates.length,
    };
  },
});
