import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { bokioAuth } from '../common/auth';
import { bokioClient } from '../common/client';
import { bokioBuilders } from '../common/builders';
import { bokioSchemas } from '../common/schemas';
import { bokioProps } from '../common/props';

export const listItems = createAction({
  auth: bokioAuth,
  name: 'list_items',
  classification: 'SEARCH',
  displayName: 'List Items',
  description: 'Lists saved items, optionally filtered by description.',
  audience: 'both',
  aiMetadata: {
    description:
      'Lists saved items in the Bokio item catalog one page at a time, optionally only those whose description contains the given text. Returns items plus totalItems, totalPages and currentPage; pageSize is 1 to 100 (default 25). Use it to find an itemId for invoice lines. Read-only.',
    idempotent: true,
  },
  outputSchema: bokioSchemas.itemPage,
  props: {
    descriptionContains: Property.ShortText({
      displayName: 'Description Contains',
      description: 'Text the item description must contain',
      required: false,
    }),
    ...bokioProps.pageProps(),
  },
  async run(context) {
    const p = context.propsValue;
    const query = bokioClient.buildFilter([
      {
        field: 'description',
        operator: '~',
        value: bokioBuilders.optionalText(p.descriptionContains),
      },
    ]);
    const body = await bokioClient.request<unknown>({
      auth: context.auth.props,
      method: HttpMethod.GET,
      path: '/items',
      operation: 'list items',
      queryParams: bokioClient.listParams({ page: p.page, pageSize: p.pageSize, query }),
    });
    return bokioClient.normalizePage<unknown>(body);
  },
});
