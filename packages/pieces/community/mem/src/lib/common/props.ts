import { HttpMethod } from '@activepieces/pieces-common';
import { Property } from '@activepieces/pieces-framework';
import { memAuth } from '../auth';
import { CollectionListResponse, memClient } from '.';

function collectionDropdown<R extends boolean>({
  displayName,
  description,
  required,
}: {
  displayName: string;
  description: string;
  required: R;
}) {
  return Property.Dropdown<string, R, typeof memAuth>({
    auth: memAuth,
    displayName,
    description,
    required,
    refreshers: [],
    options: async ({ auth }) => {
      if (!auth) {
        return { disabled: true, options: [], placeholder: 'Connect your Mem account first.' };
      }
      try {
        const options: { label: string; value: string }[] = [];
        let page: string | undefined;
        for (let i = 0; i < 20; i++) {
          const response = await memClient.request<CollectionListResponse>({
            apiKey: auth.secret_text,
            method: HttpMethod.GET,
            path: '/collections',
            query: memClient.toQuery({ limit: 100, page, order_by: 'updated_at' }),
          });
          options.push(
            ...response.results.map((collection) => ({
              label: collection.title,
              value: collection.id,
            }))
          );
          if (!response.next_page) break;
          page = response.next_page;
        }
        return { disabled: false, options };
      } catch (error) {
        return {
          disabled: true,
          options: [],
          placeholder: `Could not load collections: ${error instanceof Error ? error.message : String(error)}`,
        };
      }
    },
  });
}

function yesNoFilter({ displayName, description }: { displayName: string; description: string }) {
  return Property.StaticDropdown<string>({
    displayName,
    description,
    required: false,
    options: {
      disabled: false,
      options: [
        { label: 'Yes', value: 'yes' },
        { label: 'No', value: 'no' },
      ],
    },
  });
}

function containsFilter({ displayName, description }: { displayName: string; description: string }) {
  return Property.StaticDropdown<string>({
    displayName,
    description: `${description} Leave empty to include all notes.`,
    required: false,
    options: {
      disabled: false,
      options: [{ label: 'Yes', value: 'yes' }],
    },
  });
}

function dateFilter({ displayName, description }: { displayName: string; description: string }) {
  return Property.DateTime({ displayName, description, required: false });
}

function dateFilters() {
  return {
    created_after: dateFilter({ displayName: 'Created After', description: 'Only include items created at or after this time (inclusive).' }),
    created_before: dateFilter({ displayName: 'Created Before', description: 'Only include items created at or before this time (inclusive).' }),
    updated_after: dateFilter({ displayName: 'Updated After', description: 'Only include items updated at or after this time (inclusive).' }),
    updated_before: dateFilter({ displayName: 'Updated Before', description: 'Only include items updated at or before this time (inclusive).' }),
  };
}

function orderBy() {
  return Property.StaticDropdown<string>({
    displayName: 'Order By',
    description: 'Which timestamp to sort by. Defaults to Updated At.',
    required: false,
    options: {
      disabled: false,
      options: [
        { label: 'Updated At', value: 'updated_at' },
        { label: 'Created At', value: 'created_at' },
      ],
    },
  });
}

function noteId({ description }: { description: string }) {
  return Property.ShortText({
    displayName: 'Note ID',
    description: `${description} Find it with List Notes or Search Notes, or map it from a previous step.`,
    required: true,
  });
}

export const memProps = {
  collectionDropdown,
  yesNoFilter,
  containsFilter,
  dateFilters,
  orderBy,
  noteId,
};
