import { carboneAuth } from '../../index';
import { Property, createAction } from '@activepieces/pieces-framework';
import {
  HttpMethod,
  HttpRequest,
  httpClient,
} from '@activepieces/pieces-common';

const CARBONE_API_URL = 'https://api.carbone.io';
const CARBONE_VERSION = '5';

export const listTemplatesAction = createAction({
  auth: carboneAuth,
  name: 'carbone_list_templates',
  displayName: 'List Templates',
  description:
    'Retrieve a list of deployed Carbone templates with filtering and pagination.',
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
        'Maximum number of templates to return. Default is 100.',
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

    if (id) queryParams['id'] = id;
    if (versionId) queryParams['versionId'] = versionId;
    if (category) queryParams['category'] = category;
    if (search) queryParams['search'] = search;
    if (includeVersions !== undefined)
      queryParams['includeVersions'] = String(includeVersions);
    if (limit) queryParams['limit'] = String(limit);
    if (cursor) queryParams['cursor'] = cursor;

    const request: HttpRequest = {
      method: HttpMethod.GET,
      url: `${CARBONE_API_URL}/templates`,
      headers: {
        Authorization: `Bearer ${context.auth}`,
        'carbone-version': CARBONE_VERSION,
      },
      queryParams,
    };

    const response = await httpClient.sendRequest<{
      success: boolean;
      data: Array<{
        id: string;
        versionId: string;
        deployedAt: number;
        createdAt: number;
        expireAt: number;
        size: number;
        type: string;
        name: string;
        category: string;
        comment: string;
        tags: string[];
        origin: number;
      }>;
      hasMore: boolean;
      nextCursor?: string;
      error?: string;
    }>(request);

    if (!response.body.success) {
      throw new Error(
        `Failed to list templates: ${response.body.error ?? 'Unknown error'}`
      );
    }

    return {
      templates: response.body.data,
      hasMore: response.body.hasMore,
      nextCursor: response.body.nextCursor,
      count: response.body.data.length,
    };
  },
});
