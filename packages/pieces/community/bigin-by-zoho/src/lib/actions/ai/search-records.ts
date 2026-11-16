import { createAction, Property } from '@activepieces/pieces-framework';
import { biginAuth } from '../../auth';
import { biginAiProps } from '../../common/props';
import { getBiginConnection } from '../../common/request';
import { biginRecords } from '../../common/records';
import { escapeCriteriaValue } from '../../common/helpers';
import { biginOutputSchemas } from '../../common/output-schemas';

function buildQuery({ mode, term, field }: { mode: string; term: string; field?: string }): {
  key: 'criteria' | 'email' | 'phone' | 'word';
  value: string;
} {
  if (mode === 'email' || mode === 'phone' || mode === 'word') {
    return { key: mode, value: term };
  }
  if (mode === 'raw_criteria') {
    return { key: 'criteria', value: term };
  }
  if (!field || field.trim() === '') {
    throw new Error('Field is required when Search Mode is "Field equals" or "Field starts with".');
  }
  const comparator = mode === 'starts_with' ? 'starts_with' : 'equals';
  return { key: 'criteria', value: `(${field.trim()}:${comparator}:${escapeCriteriaValue(term)})` };
}

export const biginSearchRecordsAi = createAction({
  auth: biginAuth,
  name: 'bigin_search_records',
  classification: 'SEARCH',
  displayName: 'Search Records (Agent)',
  description: 'Search records in a Bigin module.',
  audience: 'ai',
  outputSchema: biginOutputSchemas.aiSearchPage,
  aiMetadata: {
    description:
      'Searches one Bigin module and returns matching records with their ids. Modes: email or phone lookup, free-text word search, a single field equals/starts-with match (special characters are escaped for you), or a raw Bigin criteria expression such as ((Last_Name:equals:Smith)and(Email:starts_with:j)). Returns an empty records list when nothing matches. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    module: biginAiProps.module('The Bigin module to search.'),
    mode: Property.StaticDropdown({
      displayName: 'Search Mode',
      description: 'How the search term is matched.',
      required: true,
      options: {
        options: [
          { label: 'Email', value: 'email' },
          { label: 'Phone', value: 'phone' },
          { label: 'Word (free text)', value: 'word' },
          { label: 'Field equals', value: 'equals' },
          { label: 'Field starts with', value: 'starts_with' },
          { label: 'Raw criteria', value: 'raw_criteria' },
        ],
      },
    }),
    term: Property.ShortText({
      displayName: 'Search Term',
      description: 'The value to search for, or the full criteria expression in Raw criteria mode.',
      required: true,
    }),
    field: Property.ShortText({
      displayName: 'Field',
      description: 'Field API name for the "Field equals"/"Field starts with" modes, e.g. Last_Name, Account_Name, Deal_Name.',
      required: false,
    }),
    page: Property.Number({ displayName: 'Page', description: 'Page number, starting at 1.', required: false }),
    perPage: Property.Number({ displayName: 'Per Page', description: 'Records per page, 1 to 200 (default 200).', required: false }),
  },
  async run(context) {
    const { module, mode, term, field, page, perPage } = context.propsValue;
    if (term.trim() === '') throw new Error('Search Term must not be empty.');
    if (perPage !== undefined && perPage !== null && (perPage < 1 || perPage > 200)) {
      throw new Error('Per Page must be between 1 and 200.');
    }
    const query = buildQuery({ mode, term: term.trim(), field: field ?? undefined });
    return biginRecords.search({
      connection: getBiginConnection(context.auth),
      module,
      key: query.key,
      value: query.value,
      page: page ?? undefined,
      perPage: perPage ?? undefined,
    });
  },
});
