import { DropdownState, Property } from '@activepieces/pieces-framework';

import { raindropAuth } from '../auth';
import { raindropApi } from './api';

function collectionId<R extends boolean>({
  required,
  displayName = 'Collection',
  description = 'Select the collection to use. Leave empty to use "Unsorted" (default inbox).',
}: PropParams<R>) {
  return Property.Dropdown({
    displayName,
    description,
    refreshers: [],
    required,
    auth: raindropAuth,
    options: async ({ auth }) => {
      if (!auth) {
        return disabledOptions({
          placeholder: 'Please connect your account first',
        });
      }
      try {
        const [rootCollections, childCollections] = await Promise.all([
          raindropApi.listCollections({ auth }),
          raindropApi.listChildCollections({ auth }),
        ]);
        const allCollections = [...rootCollections, ...childCollections];
        return {
          disabled: false,
          options: [
            { label: 'Unsorted', value: -1 },
            ...allCollections.map((c) => ({ label: c.title, value: c._id })),
          ],
        };
      } catch {
        return disabledOptions({
          placeholder: 'Failed to load collections. Check your connection.',
        });
      }
    },
  });
}

function disabledOptions({ placeholder }: { placeholder: string }): DropdownState<never> {
  return { disabled: true, options: [], placeholder };
}

export const raindropProps = { collectionId };

export type PropParams<R extends boolean> = {
  required: R;
  displayName?: string;
  description?: string;
};
