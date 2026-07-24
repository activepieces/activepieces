import { createAction, Property } from '@activepieces/pieces-framework';
import {
  AuthenticationType,
  HttpMethod,
  HttpRequest,
  QueryParams,
  httpClient,
} from '@activepieces/pieces-common';
import { airtableAuth } from '../auth';
import { AirtableComment } from '../common/models';
import { listRecordCommentsActionOutputSchema } from '../output-schemas';

export const airtableListRecordCommentsAction = createAction({
  auth: airtableAuth,
  name: 'list_record_comments',
  displayName: 'List Record Comments (Agent)',
  description: "Read a record's comment thread.",
  audience: 'ai',
  outputSchema: listRecordCommentsActionOutputSchema,
  aiMetadata: {
    description:
      "Returns the comments on a record, each with its comment ID, author and text — use to read a record's discussion or to find a parent comment ID for a threaded reply. Requires a token with the data.recordComments:read scope. Read-only and idempotent.",
    idempotent: true,
  },
  props: {
    base_id: Property.ShortText({
      displayName: 'Base ID',
      description:
        'The Airtable base ID (e.g. "appXXXXXXXXXXXXXX"). Resolve it with List Bases (Agent).',
      required: true,
    }),
    table_id_or_name: Property.ShortText({
      displayName: 'Table ID or Name',
      description:
        'The table ID (e.g. "tblXXXXXXXXXXXXXX") or its exact name. Resolve it with Get Base Schema (Agent).',
      required: true,
    }),
    record_id: Property.ShortText({
      displayName: 'Record ID',
      description:
        'The record ID (e.g. "recXXXXXXXXXXXXXX") whose comments to list.',
      required: true,
    }),
    page_size: Property.Number({
      displayName: 'Page Size',
      description: 'Optional number of comments per page (max 100).',
      required: false,
    }),
    offset: Property.ShortText({
      displayName: 'Offset',
      description:
        'Optional pagination offset returned by a previous call to fetch the next page.',
      required: false,
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;
    const { base_id, table_id_or_name, record_id, page_size, offset } =
      propsValue;

    const queryParams: QueryParams = {};
    if (page_size !== undefined && page_size !== null) {
      queryParams['pageSize'] = String(page_size);
    }
    if (offset) {
      queryParams['offset'] = offset;
    }

    const request: HttpRequest = {
      method: HttpMethod.GET,
      url: `https://api.airtable.com/v0/${base_id}/${encodeURIComponent(
        table_id_or_name
      )}/${record_id}/comments`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: auth.secret_text,
      },
      queryParams,
    };

    try {
      const response = await httpClient.sendRequest<{
        comments: AirtableComment[];
        offset?: string;
      }>(request);
      return {
        comments: response.body.comments,
        count: response.body.comments.length,
        offset: response.body.offset ?? null,
      };
    } catch (error: any) {
      const status = error?.response?.status;
      if (status === 401 || status === 403) {
        throw new Error(
          'Airtable rejected the request (permission). Reading comments requires a token with the data.recordComments:read scope.'
        );
      }
      if (status === 404) {
        throw new Error(
          `Base "${base_id}", table "${table_id_or_name}", or record "${record_id}" was not found. Verify the IDs with List Bases (Agent) and Get Base Schema (Agent).`
        );
      }
      if (status === 429) {
        throw new Error('Airtable rate limit hit (429). Retry after a short delay.');
      }
      throw error;
    }
  },
});
