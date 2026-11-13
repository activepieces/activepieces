import { createAction, Property } from '@activepieces/pieces-framework';
import type { EntityType, SearchRequest, SearchResponse } from '@microsoft/microsoft-graph-types';

import { microsoftSharePointAuth } from '../../../auth';
import { microsoftSharePointClient } from '../../../common/client';
import { microsoftSharepointSearchOutputSchema } from '../../../output-schemas';

export const searchAction = createAction({
  auth: microsoftSharePointAuth,
  name: 'microsoft_sharepoint_search',
  outputSchema: microsoftSharepointSearchOutputSchema,
  displayName: 'Search',
  description: 'Searches SharePoint and OneDrive for files, list items, lists, sites and libraries.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Runs a KQL search across the SharePoint sites and OneDrive the user can access and returns ranked hits for the chosen entity types, each with the resource and its IDs. Use From and Size to page; use Find File or Find Site for a simple name lookup.',
    idempotent: true,
  },
  props: {
    entityTypes: Property.StaticMultiSelectDropdown({
      displayName: 'Entity Types',
      description: 'Kinds of results to return: driveItem (files and folders), listItem, list, site or drive (document libraries).',
      required: true,
      options: {
        options: [
          { label: 'Files and Folders (driveItem)', value: 'driveItem' },
          { label: 'List Items (listItem)', value: 'listItem' },
          { label: 'Lists (list)', value: 'list' },
          { label: 'Sites (site)', value: 'site' },
          { label: 'Document Libraries (drive)', value: 'drive' },
        ],
      },
    }),
    queryString: Property.LongText({
      displayName: 'Query',
      description:
        'KQL search query, like "budget filetype:xlsx" or "contoso AND path:\\"https://contoso.sharepoint.com/sites/hr\\"".',
      required: true,
    }),
    from: Property.Number({
      displayName: 'From',
      description: 'Offset of the first result, starting at 0. Defaults to 0.',
      required: false,
      defaultValue: 0,
    }),
    size: Property.Number({
      displayName: 'Size',
      description: 'Number of results to return, from 1 to 500. Defaults to 25.',
      required: false,
      defaultValue: 25,
    }),
  },
  async run({ auth, propsValue }) {
    const entityTypes = propsValue.entityTypes.filter(
      (value): value is EntityType => SEARCH_ENTITY_TYPES.some((type) => type === value)
    );
    if (entityTypes.length === 0 || entityTypes.length !== propsValue.entityTypes.length) {
      throw new Error(`Entity Types must be one or more of: ${SEARCH_ENTITY_TYPES.join(', ')}.`);
    }
    const from = propsValue.from ?? 0;
    if (!Number.isInteger(from) || from < 0) {
      throw new Error('From must be a whole number of at least 0.');
    }
    const size = propsValue.size ?? DEFAULT_SIZE;
    if (!Number.isInteger(size) || size < 1) {
      throw new Error('Size must be a whole number of at least 1.');
    }
    const request: SearchRequest = {
      entityTypes,
      query: { queryString: propsValue.queryString },
      from,
      size: Math.min(size, MAX_SIZE),
    };
    const response: { value: SearchResponse[] } = await microsoftSharePointClient
      .create({ auth })
      .api('/search/query')
      .post({ requests: [request] });
    return response;
  },
});

const SEARCH_ENTITY_TYPES = ['driveItem', 'listItem', 'list', 'site', 'drive'] as const;
const DEFAULT_SIZE = 25;
const MAX_SIZE = 500;
