import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';

import { retableAuth } from '../..';
import { retableCommon } from '../common';

export const retableSearchRowsAction = createAction({
  auth: retableAuth,
  name: 'retable_search_rows',
  classification: 'SEARCH',
  displayName: 'Search Rows',
  description: 'Searches for rows in a retable matching a term in a column',
  audience: 'ai',
  aiMetadata: { description: 'Searches a Retable table for rows whose value in a given column matches the search term (full-value match on text columns). Use to find rows without knowing their row id. Idempotent read.', idempotent: true },
  props: {
    retable_id: Property.ShortText({
      displayName: 'Retable ID',
      description: 'ID of the retable, from Get Specific Table or Get Retables',
      required: true,
    }),
    columnID: Property.ShortText({
      displayName: 'Column ID',
      description: 'Column id to search within',
      required: true,
    }),
    term: Property.ShortText({
      displayName: 'Search Term',
      required: true,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      required: false,
    }),
    offset: Property.Number({
      displayName: 'Offset',
      required: false,
    }),
    columnIDs: Property.ShortText({
      displayName: 'Column IDs to Return',
      description: 'Comma-separated column ids to include in the response',
      required: false,
    }),
  },
  async run(context) {
    const { retable_id, columnID, term, limit, offset, columnIDs } = context.propsValue;
    return (
      await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: `${retableCommon.baseUrl}/retable/${retable_id}/search`,
        headers: {
          ApiKey: context.auth.secret_text,
        },
        queryParams: {
          columnID,
          term,
          ...(limit !== undefined ? { limit: String(limit) } : {}),
          ...(offset !== undefined ? { offset: String(offset) } : {}),
          ...(columnIDs ? { columnIDs } : {}),
        },
      })
    ).body;
  },
});
