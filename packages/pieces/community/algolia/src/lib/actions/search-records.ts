import { createAction, Property } from '@activepieces/pieces-framework';

import { algoliaAuth } from '../common/auth';
import { searchAlgoliaRecords } from '../common/client';
import { algoliaOutputSchemas } from '../common/output-schemas';
import { algoliaProps } from '../common/props';
import {
  parseIntegerInRange,
  parseOptionalString,
  parseOptionalStringArray,
  parseRequiredString,
  stripHighlights,
} from '../common/utils';

export const searchRecordsAction = createAction({
  auth: algoliaAuth,
  name: 'search_records',
  classification: 'SEARCH',
  displayName: 'Search Records',
  description: 'Runs a relevance-ranked search on an Algolia index.',
  audience: 'ai',
  aiMetadata: {
    description: 'Runs a relevance-ranked full-text search on one Algolia index and returns the matching records (hits) with total hit and page counts. Use an empty query with filters to list records matching attribute conditions. The filters string uses Algolia syntax, e.g. `category:books AND price < 20`; an attribute only filters if it is listed in attributesForFaceting (check with Get Index Settings) — otherwise the filter silently matches nothing (numeric comparisons work without it). Highlight/snippet data is removed unless includeHighlights is true. Read-only and idempotent.',
    idempotent: true,
  },
  outputSchema: algoliaOutputSchemas.searchRecords,
  props: {
    indexName: algoliaProps.indexName(),
    query: Property.ShortText({
      displayName: 'Query',
      description: 'Search text. Leave empty to match all records (useful with filters).',
      required: false,
    }),
    filters: Property.ShortText({
      displayName: 'Filters',
      description: 'Algolia filter expression, e.g. category:books AND price < 20. Attributes must be in attributesForFaceting.',
      required: false,
    }),
    hitsPerPage: Property.Number({
      displayName: 'Hits Per Page',
      description: 'Number of hits to return (1-1000). Defaults to 20.',
      required: false,
      defaultValue: 20,
    }),
    page: Property.Number({
      displayName: 'Page',
      description: 'Zero-based page number. Defaults to 0.',
      required: false,
      defaultValue: 0,
    }),
    attributesToRetrieve: Property.Array({
      displayName: 'Attributes To Retrieve',
      description: 'Only return these attributes for each hit. Leave empty to use the index default.',
      required: false,
    }),
    includeHighlights: Property.Checkbox({
      displayName: 'Include Highlights',
      description: 'Keep _highlightResult and _snippetResult in each hit.',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const { propsValue } = context;
    const response = await searchAlgoliaRecords({
      auth: context.auth,
      indexName: parseRequiredString(propsValue.indexName, 'Index Name'),
      query: parseOptionalString(propsValue.query) ?? '',
      filters: parseOptionalString(propsValue.filters),
      hitsPerPage: parseIntegerInRange({
        value: propsValue.hitsPerPage,
        fieldName: 'Hits Per Page',
        min: 1,
        max: 1000,
        defaultValue: 20,
      }),
      page: parseIntegerInRange({
        value: propsValue.page,
        fieldName: 'Page',
        min: 0,
        max: 1000,
        defaultValue: 0,
      }),
      attributesToRetrieve: parseOptionalStringArray({
        value: propsValue.attributesToRetrieve,
        fieldName: 'Attributes To Retrieve',
      }),
    });

    return {
      hits: propsValue.includeHighlights
        ? response.hits
        : response.hits.map(stripHighlights),
      nbHits: response.nbHits,
      page: response.page,
      nbPages: response.nbPages,
      hitsPerPage: response.hitsPerPage,
      query: response.query,
    };
  },
});
