import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { elevenlabsAuth } from '../../auth';
import { elevenlabsClient } from '../../client';
import { elevenlabsListPronunciationDictionariesOutputSchema } from '../../output-schemas';

export const listPronunciationDictionaries = createAction({
  auth: elevenlabsAuth,
  name: 'elevenlabs_list_pronunciation_dictionaries',
  outputSchema: elevenlabsListPronunciationDictionariesOutputSchema,
  displayName: 'List Pronunciation Dictionaries',
  description: 'List pronunciation dictionaries',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description: 'Lists pronunciation dictionaries with their ids and latest version ids. Page with next_cursor.',
    idempotent: true,
  },
  props: {
    cursor: Property.ShortText({ displayName: 'Cursor', description: 'next_cursor from a previous call', required: false }),
    pageSize: Property.Number({ displayName: 'Page Size', description: 'Between 1 and 100', required: false }),
    sort: Property.StaticDropdown({ displayName: 'Sort', required: false, options: { options: [{ label: 'creation_time_unix', value: 'creation_time_unix' }, { label: 'name', value: 'name' }] } }),
    includeArchived: Property.StaticDropdown({ displayName: 'Include Archived', description: 'Include archived dictionaries', required: false, options: { options: [{ label: 'Yes', value: true }, { label: 'No', value: false }] } }),
  },
  async run({ auth, propsValue }) {
    const response = await elevenlabsClient.request<Record<string, unknown> & { pronunciation_dictionaries: unknown[] }>({
      auth,
      method: HttpMethod.GET,
      path: `/v1/pronunciation-dictionaries`,
      queryParams: { cursor: propsValue.cursor, page_size: propsValue.pageSize, sort: propsValue.sort, include_archived: propsValue.includeArchived },
    });
    return { ...response, count: response.pronunciation_dictionaries.length };
  },
});
