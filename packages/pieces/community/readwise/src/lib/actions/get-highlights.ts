import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { readwiseAuth } from '../../index';
import {
  makeReadwiseRequest,
  ReadwisePaginatedResponse,
  ReadwiseHighlight,
} from '../common/client';

export const getHighlights = createAction({
  name: 'get_highlights',
  displayName: 'Get Highlights',
  description: 'Retrieve your Readwise highlights, optionally filtered by book or date.',
  auth: readwiseAuth,
  props: {
    book_id: Property.ShortText({
      displayName: 'Book ID (optional)',
      description: 'Filter highlights by a specific book ID.',
      required: false,
    }),
    updated_after: Property.DateTime({
      displayName: 'Updated After (optional)',
      description: 'Return only highlights updated after this date.',
      required: false,
    }),
    page_size: Property.Number({
      displayName: 'Page Size',
      description: 'Number of highlights to return (max 1000).',
      required: false,
      defaultValue: 100,
    }),
  },
  async run(context) {
    const token = context.auth.secret_text;
    const queryParams: Record<string, string> = {
      page_size: String(context.propsValue.page_size ?? 100),
    };
    if (context.propsValue.book_id) {
      queryParams['book_id'] = context.propsValue.book_id;
    }
    if (context.propsValue.updated_after) {
      queryParams['updated__gt'] = new Date(context.propsValue.updated_after).toISOString();
    }
    return makeReadwiseRequest<ReadwisePaginatedResponse<ReadwiseHighlight>>({
      token,
      method: HttpMethod.GET,
      endpoint: '/highlights/',
      params: queryParams,
    });
  },
});
