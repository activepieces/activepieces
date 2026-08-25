import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { readwiseAuth } from '../common/auth';
import {
  makeReadwiseRequest,
  ReadwisePaginatedResponse,
  ReadwiseHighlight,
} from '../common/client';
import { readwiseProps } from '../common/props';

export const getHighlights = createAction({
  name: 'get_highlights',
  displayName: 'Get Highlights',
  description:
    'Retrieve your Readwise highlights, optionally filtered by book or date.',
  audience: 'both',
  aiMetadata: {
    description:
      'Lists highlights from the connected Readwise account. With no filters it returns all highlights (paginated); set book_id to scope to one source or updated_after to fetch only highlights changed since a timestamp. Use when an agent needs to read or search existing highlights. Read-only and idempotent.',
    idempotent: true,
  },
  auth: readwiseAuth,
  props: {
    book_id: readwiseProps.bookId({ required: false }),
    updated_after: Property.DateTime({
      displayName: 'Updated After',
      description: 'Return only highlights updated after this date.',
      required: false,
    }),
    page_size: Property.Number({
      displayName: 'Page Size',
      description: 'Number of highlights to return per page (max 1000).',
      required: false,
      defaultValue: 100,
    }),
    page: Property.Number({
      displayName: 'Page',
      description: 'Which page of results to return (starts at 1).',
      required: false,
    }),
  },
  async run(context) {
    const token = context.auth.secret_text;
    const { book_id, updated_after, page_size, page } = context.propsValue;
    const params: Record<string, string> = {
      page_size: String(page_size ?? 100),
    };
    if (book_id) {
      params['book_id'] = book_id;
    }
    if (updated_after) {
      params['updated__gt'] = new Date(updated_after).toISOString();
    }
    if (page) {
      params['page'] = String(page);
    }
    return makeReadwiseRequest<ReadwisePaginatedResponse<ReadwiseHighlight>>({
      token,
      method: HttpMethod.GET,
      endpoint: '/highlights/',
      params,
    });
  },
});
