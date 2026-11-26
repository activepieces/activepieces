import { carboneAuth } from '../auth';
import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { carboneClient } from '../common/client';

export const listTagsAction = createAction({
  auth: carboneAuth,
  name: 'carbone_list_tags',
  classification: 'SEARCH',
  displayName: 'List Tags',
  description: 'List all tags used to organize your Carbone templates.',
  audience: 'both',
  aiMetadata: {
    description: 'Returns all tag names currently used to organize Carbone templates. Use to discover existing tag values before uploading or updating templates; List Templates cannot filter by tag. Idempotent: read-only lookup with no inputs.',
    idempotent: true,
  },
  outputSchema: {
    fields: [
      { key: 'tags', label: 'Tags' },
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
      path: '/templates/tags',
      operation: 'list tags',
    });
    const items = response.body.data ?? [];
    return {
      tags: items.map((item) => item.name),
      count: items.length,
    };
  },
});
