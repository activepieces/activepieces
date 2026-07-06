import { HttpMethod } from '@activepieces/pieces-common';
import { Property } from '@activepieces/pieces-framework';
import { sliteAuth } from '../auth';
import { sliteApi } from './client';
import { SliteSearchResponse } from './types';

const noteId = ({
  required = true,
  displayName = 'Doc',
  description = 'Start typing to search your docs by title.',
}: {
  required?: boolean;
  displayName?: string;
  description?: string;
} = {}) =>
  Property.Dropdown({
    displayName,
    description,
    auth: sliteAuth,
    required,
    refreshers: [],
    options: async ({ auth, searchValue }) => {
      if (!auth) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Please connect your Slite account first.',
        };
      }
      try {
        const query = typeof searchValue === 'string' ? searchValue : undefined;
        const response = await sliteApi.call<SliteSearchResponse>({
          apiKey: auth.secret_text,
          method: HttpMethod.GET,
          resourceUri: '/search-notes',
          query: { query, hitsPerPage: 100 },
        });
        const hits = response.hits ?? [];
        if (hits.length === 0) {
          return {
            disabled: false,
            options: [],
            placeholder: 'No docs found.',
          };
        }
        return {
          disabled: false,
          options: hits.map((hit) => ({
            label: hit.title || hit.id,
            value: hit.id,
          })),
        };
      } catch (e) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Could not load docs. Check your connection.',
        };
      }
    },
  });

export const sliteProps = {
  noteId,
};
