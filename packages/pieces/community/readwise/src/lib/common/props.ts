import { HttpMethod } from '@activepieces/pieces-common';
import { Property } from '@activepieces/pieces-framework';
import { readwiseAuth } from './auth';
import {
  makeReadwiseRequest,
  ReadwiseBook,
  ReadwisePaginatedResponse,
} from './client';

const bookId = ({ required = false }: { required?: boolean } = {}) =>
  Property.Dropdown({
    displayName: 'Book',
    description: 'The book or article to filter highlights by.',
    auth: readwiseAuth,
    required,
    refreshers: [],
    options: async ({ auth }) => {
      if (!auth) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Please connect your Readwise account first.',
        };
      }
      try {
        const response = await makeReadwiseRequest<
          ReadwisePaginatedResponse<ReadwiseBook>
        >({
          token: auth.secret_text,
          method: HttpMethod.GET,
          endpoint: '/books/',
          params: { page_size: '1000' },
        });
        if (response.results.length === 0) {
          return {
            disabled: false,
            options: [],
            placeholder: 'No books found in your Readwise library.',
          };
        }
        return {
          disabled: false,
          options: response.results.map((book) => ({
            label: book.author ? `${book.title} — ${book.author}` : book.title,
            value: String(book.id),
          })),
        };
      } catch (e) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Could not load books. Check your connection.',
        };
      }
    },
  });

export const readwiseProps = {
  bookId,
};
