import { carboneAuth } from '../auth';
import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { carboneClient } from '../common/client';

export const listCategoriesAction = createAction({
  auth: carboneAuth,
  name: 'carbone_list_categories',
  classification: 'SEARCH',
  displayName: 'List Categories',
  description: 'List all categories used to organize your Carbone templates.',
  audience: 'both',
  aiMetadata: {
    description: 'Returns all category names currently used to organize Carbone templates. Use to discover valid category values before filtering, uploading, or updating templates. Idempotent: read-only lookup with no inputs.',
    idempotent: true,
  },
  outputSchema: {
    fields: [
      { key: 'categories', label: 'Categories' },
      { key: 'count', label: 'Count', format: 'number' },
    ],
  },
  props: {},
  async run(context) {
    const response = await carboneClient.request<{
      success: boolean;
      data?: Array<{ name: string }>;
    }>({
      apiKey: context.auth.secret_text,
      method: HttpMethod.GET,
      path: '/templates/categories',
      operation: 'list categories',
    });
    const items = response.body.data ?? [];
    return {
      categories: items.map((item) => item.name),
      count: items.length,
    };
  },
});
