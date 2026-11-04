import { DropdownState, Property } from '@activepieces/pieces-framework';
import { parseurAuth } from '../auth';
import { parseurApi } from './api';

function parserId<R extends boolean>({
  required,
  displayName = 'Parser',
  description = 'Select the parser',
}: PropParams<R>) {
  return Property.Dropdown({
    auth: parseurAuth,
    displayName,
    description,
    required,
    refreshers: ['auth'],
    refreshOnSearch: true,
    options: async ({ auth }, { searchValue: search }) => {
      if (!auth) {
        return disabledOptions({
          placeholder: 'Please select an API Key first',
        });
      }
      const response = await parseurApi.listMailboxes({
        auth,
        query: { search },
      });
      return {
        disabled: false,
        options: response.results.map((parser) => ({
          label: parser.name,
          value: parser.id,
        })),
      };
    },
  });
}

function documentId<R extends boolean>({
  required,
  displayName = 'Document',
  description = 'Select the document',
}: PropParams<R>) {
  return Property.Dropdown({
    auth: parseurAuth,
    displayName,
    description,
    required,
    refreshers: ['auth', 'parserId'],
    refreshOnSearch: true,
    options: async ({ auth, parserId }, { searchValue: search }) => {
      if (!auth) {
        return disabledOptions({
          placeholder: 'Please select an API Key first',
        });
      }
      if (!parserId) {
        return disabledOptions({ placeholder: 'Please select a Parser first' });
      }
      const response = await parseurApi.listDocuments({
        auth,
        parserId: String(parserId),
        query: { search },
      });
      return {
        disabled: false,
        options: response.results.map((document) => ({
          label: document.name,
          value: document.id.toString(),
        })),
      };
    },
  });
}

function disabledOptions({
  placeholder,
}: {
  placeholder: string;
}): DropdownState<never> {
  return { disabled: true, options: [], placeholder };
}

export const parseurProps = { parserId, documentId };

export type PropParams<R extends boolean> = {
  required: R;
  displayName?: string;
  description?: string;
};
