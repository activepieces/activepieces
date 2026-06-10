import { Property } from '@activepieces/pieces-framework';
import { tryCatch } from '@activepieces/shared';

import { algoliaAuth } from './auth';
import { listAlgoliaIndices } from './client';
import { isAlgoliaAuthValue } from './utils';

export const algoliaProps = {
  index: (required = true) =>
    Property.Dropdown({
      auth: algoliaAuth,
      displayName: 'Index',
      description: 'Select the Algolia index to use.',
      required,
      refreshers: ['auth'],
      options: async ({ auth }) => {
        if (!isAlgoliaAuthValue(auth)) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Connect your account first',
          };
        }

        const { data: indices, error } = await tryCatch(() =>
          listAlgoliaIndices({
            auth,
          }),
        );

        if (error) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Failed to load indices. Check your connection.',
          };
        }

        if (indices.length === 0) {
          return {
            disabled: false,
            options: [],
            placeholder: 'No indices found. Save records to a new index first.',
          };
        }

        return {
          disabled: false,
          options: indices.map((index) => ({
            label: index.name,
            value: index.name,
          })),
        };
      },
    }),
};
