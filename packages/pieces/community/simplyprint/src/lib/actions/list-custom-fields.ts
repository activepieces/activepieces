import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';

import { simplyprintAuth } from '../auth';
import { simplyprintClient } from '../common/client';
import { CustomField } from '../common/types';

export const listCustomFieldsAction = createAction({
  auth: simplyprintAuth,
  name: 'list_custom_fields',
  displayName: 'List Custom Fields',
  description: 'List all custom field definitions on your account.',
  props: {
    entity: Property.ShortText({
      displayName: 'Entity filter',
      description: 'Optional — e.g. PRINT_QUEUE, FILE, USER. Leave empty to list all.',
      required: false,
    }),
    page: Property.Number({
      displayName: 'Page (optional)',
      description:
        'Specific page number (1-based). Leave empty to walk all pages and return every field.',
      required: false,
    }),
    pageSize: Property.Number({
      displayName: 'Page size (optional)',
      description: 'Items per page (max 100). Defaults to 100 when paging is requested.',
      required: false,
    }),
  },
  async run(context) {
    // custom_fields/Get is paginated and `page`/`page_size` are required
    // in $this->POST.
    const pageSize = Math.min(100, context.propsValue.pageSize ?? 100);
    const entity = context.propsValue.entity?.trim();
    const explicitPage = context.propsValue.page;

    if (typeof explicitPage === 'number' && explicitPage >= 1) {
      // Single-page mode. Return whatever the backend gives us — caller
      // is paginating themselves.
      const res = await simplyprintClient.simplyprintCall<{
        data: CustomField[];
        page_amount?: number;
        total?: number;
      }>({
        auth: context.auth,
        method: HttpMethod.POST,
        path: 'custom_fields/Get',
        body: { page: Math.floor(explicitPage), page_size: pageSize },
      });
      const data = (res.data ?? []) as CustomField[];
      return entity ? { ...res, data: data.filter((f) => f.entity === entity) } : res;
    }

    // Default (0.5.10-compatible): walk every page and flatten.
    const all: CustomField[] = [];
    let page = 1;
    const maxPages = 50;
    for (let i = 0; i < maxPages; i++) {
      const res = await simplyprintClient.simplyprintCall<{
        data: CustomField[];
        page_amount?: number;
      }>({
        auth: context.auth,
        method: HttpMethod.POST,
        path: 'custom_fields/Get',
        body: { page, page_size: pageSize },
      });
      const batch = (res.data ?? []) as CustomField[];
      all.push(...batch);
      const totalPages = res.page_amount ?? 1;
      if (page >= totalPages || batch.length < pageSize) break;
      page++;
    }
    return entity ? all.filter((f) => f.entity === entity) : all;
  },
});
