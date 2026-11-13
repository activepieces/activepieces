import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { gravityFormsAuth } from '../../auth';
import { gravityFormsAiProps } from '../../common/ai-props';
import { gravityFormsClient } from '../../common/client';
import type { GravityFormsEntryList } from '../../common/types';
import { gravityFormsUtils } from '../../common/utils';
import { gravityformsListEntriesOutputSchema } from '../../output-schemas';

const SORT_DIRECTIONS = ['ASC', 'DESC', 'RAND'];
const MAX_PAGE_SIZE = 200;

export const listEntriesAction = createAction({
  auth: gravityFormsAuth,
  name: 'gravityforms_list_entries',
  outputSchema: gravityformsListEntriesOutputSchema,
  displayName: 'List Entries',
  description: 'Searches form entries with filters, sorting and paging.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Searches entries across all forms, or one form when Form ID is set, newest first by default. Returns total_count for the whole search and one page of entries; use Page to read further. Field values are keyed by field id; use Get Form for labels and List Field Filters for filter keys.',
    idempotent: true,
  },
  props: {
    formId: gravityFormsAiProps.formId({
      required: false,
      description: 'Only return entries of this form, e.g. "14". Use List Forms to find it. Defaults to all forms.',
    }),
    status: gravityFormsAiProps.status({ required: false }),
    fieldFilters: gravityFormsAiProps.fieldFilters({ required: false }),
    filterMode: gravityFormsAiProps.filterMode({ required: false }),
    sortKey: Property.ShortText({
      displayName: 'Sort By',
      description: 'Field id or entry property to sort by, e.g. "date_created" or "3". Defaults to "id".',
      required: false,
    }),
    sortDirection: Property.StaticDropdown({
      displayName: 'Sort Direction',
      description: '"ASC", "DESC" or "RAND". Defaults to "DESC".',
      required: false,
      options: {
        options: SORT_DIRECTIONS.map((direction) => ({ label: direction, value: direction })),
      },
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: `Entries per page (1-${MAX_PAGE_SIZE}). Defaults to 20.`,
      required: false,
    }),
    page: Property.Number({
      displayName: 'Page',
      description: 'Page number, starting at 1. Defaults to 1.',
      required: false,
    }),
  },
  async run(context) {
    const { formId, status, fieldFilters, filterMode, sortKey, sortDirection, limit, page } = context.propsValue;
    if (sortDirection !== undefined && !SORT_DIRECTIONS.includes(sortDirection)) {
      throw new Error(`Sort Direction must be one of ${SORT_DIRECTIONS.join(', ')}.`);
    }
    return await gravityFormsClient.request<GravityFormsEntryList>({
      auth: context.auth,
      method: HttpMethod.GET,
      path: formId ? `/forms/${encodeURIComponent(formId)}/entries` : '/entries',
      query: {
        ...gravityFormsUtils.searchQuery({ status, fieldFilters, filterMode }),
        ...(sortKey ? { 'sorting[key]': sortKey } : {}),
        ...(sortDirection ? { 'sorting[direction]': sortDirection } : {}),
        'paging[page_size]': String(Math.min(Math.max(limit ?? 20, 1), MAX_PAGE_SIZE)),
        'paging[current_page]': String(Math.max(page ?? 1, 1)),
      },
    });
  },
});
