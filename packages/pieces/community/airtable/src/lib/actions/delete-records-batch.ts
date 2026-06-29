import { createAction, Property } from '@activepieces/pieces-framework';
import {
  AuthenticationType,
  HttpMethod,
  HttpRequest,
  QueryParams,
  httpClient,
} from '@activepieces/pieces-common';
import { airtableAuth } from '../auth';

export const airtableDeleteRecordsBatchAction = createAction({
  auth: airtableAuth,
  name: 'delete_records_batch',
  displayName: 'Delete Records Batch (Agent)',
  description: 'Delete up to 10 records by ID in one call.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Permanently deletes up to 10 records from a table in one call, given their record IDs. Use to remove several rows at once; to delete a single record use Delete Record (Agent). Effectively idempotent: the end state is the records gone (a repeat call reports the already-deleted IDs).',
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
    record_ids: Property.Array({
      displayName: 'Record IDs',
      description:
        'A list of up to 10 record IDs to delete, e.g. ["recAAA", "recBBB"]. Resolve IDs with Search Records (Agent) or List Records (Agent).',
      required: true,
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;
    const { base_id, table_id_or_name, record_ids } = propsValue;

    const ids = record_ids as string[];
    if (!Array.isArray(ids) || ids.length === 0) {
      throw new Error('Record IDs must be a non-empty list.');
    }
    if (ids.length > 10) {
      throw new Error(
        `Airtable deletes at most 10 records per call; received ${ids.length}. Split into batches of 10.`
      );
    }

    const queryParams: QueryParams = {};
    ids.forEach((id, index) => {
      queryParams[`records[${index}]`] = id;
    });

    const request: HttpRequest = {
      method: HttpMethod.DELETE,
      url: `https://api.airtable.com/v0/${base_id}/${encodeURIComponent(
        table_id_or_name
      )}`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: auth.secret_text,
      },
      queryParams,
    };

    try {
      const response = await httpClient.sendRequest<{
        records: { id: string; deleted: boolean }[];
      }>(request);
      return {
        records: response.body.records,
        count: response.body.records.length,
      };
    } catch (error: any) {
      const status = error?.response?.status;
      if (status === 401 || status === 403) {
        throw new Error(
          'Airtable rejected the request (permission). Ensure the token has data.records.write scope and access to this base.'
        );
      }
      if (status === 404) {
        throw new Error(
          `Base "${base_id}" or table "${table_id_or_name}" was not found. Verify the IDs with List Bases (Agent) and Get Base Schema (Agent).`
        );
      }
      if (status === 422) {
        throw new Error(
          'Airtable rejected the delete (422). Check the record IDs are valid and at most 10.'
        );
      }
      if (status === 429) {
        throw new Error('Airtable rate limit hit (429). Retry after a short delay.');
      }
      throw error;
    }
  },
});
