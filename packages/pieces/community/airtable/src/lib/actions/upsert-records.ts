import { createAction, Property } from '@activepieces/pieces-framework';
import {
  AuthenticationType,
  HttpMethod,
  HttpRequest,
  httpClient,
} from '@activepieces/pieces-common';
import { airtableAuth } from '../auth';
import { AirtableRecord } from '../common/models';
import { upsertRecordsActionOutputSchema } from '../output-schemas';

export const airtableUpsertRecordsAction = createAction({
  auth: airtableAuth,
  name: 'upsert_records',
  displayName: 'Upsert Records (Agent)',
  description: 'Create or update up to 10 records in one batch call.',
  audience: 'ai',
  outputSchema: upsertRecordsActionOutputSchema,
  aiMetadata: {
    description:
      'Batch upserts up to 10 records in one PATCH call. When Fields To Merge On is set, each record is matched on those field values and updated if found or created if not (keyed upsert). Without it, records that include an id are updated and the rest created. Idempotent: re-running with the same merge keys converges to the same state rather than duplicating.',
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
    records: Property.Json({
      displayName: 'Records',
      description:
        'A JSON array of up to 10 records, each shaped {"fields": {"Name": "Acme", "Status": "Active"}}. To update an existing record without merge keys, include its id: {"id": "recXXXX", "fields": {...}}. Use Get Base Schema (Agent) for field names.',
      required: true,
    }),
    fields_to_merge_on: Property.Array({
      displayName: 'Fields To Merge On',
      description:
        'Optional list of field names used as the match key for upsert, e.g. ["Email"]. When set, records matching on these fields are updated, others created. Leave empty for a plain batch update by id.',
      required: false,
    }),
    typecast: Property.Checkbox({
      displayName: 'Typecast',
      description:
        'When true (default), Airtable coerces string values to the field type and auto-creates select options. Set false for strict typing.',
      required: false,
      defaultValue: true,
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;
    const { base_id, table_id_or_name, records, fields_to_merge_on, typecast } =
      propsValue;

    const recordList = records as unknown as {
      id?: string;
      fields: Record<string, unknown>;
    }[];

    if (!Array.isArray(recordList) || recordList.length === 0) {
      throw new Error('Records must be a non-empty JSON array.');
    }
    if (recordList.length > 10) {
      throw new Error(
        `Airtable accepts at most 10 records per upsert call; received ${recordList.length}. Split into batches of 10.`
      );
    }

    const mergeFields = (fields_to_merge_on as string[] | undefined) ?? [];

    const body: {
      records: { id?: string; fields: Record<string, unknown> }[];
      typecast: boolean;
      performUpsert?: { fieldsToMergeOn: string[] };
    } = {
      records: recordList,
      typecast: typecast ?? true,
    };
    if (mergeFields.length > 0) {
      body.performUpsert = { fieldsToMergeOn: mergeFields };
    }

    const request: HttpRequest = {
      method: HttpMethod.PATCH,
      url: `https://api.airtable.com/v0/${base_id}/${encodeURIComponent(
        table_id_or_name
      )}`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: auth.secret_text,
      },
      body,
    };

    try {
      const response = await httpClient.sendRequest<{
        records: AirtableRecord[];
        createdRecords?: string[];
        updatedRecords?: string[];
      }>(request);
      return {
        records: response.body.records,
        count: response.body.records.length,
        createdRecords: response.body.createdRecords ?? [],
        updatedRecords: response.body.updatedRecords ?? [],
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
          'Airtable rejected the upsert (422). Check the records array shape, that fieldsToMergeOn names exist, and the field values.'
        );
      }
      if (status === 429) {
        throw new Error('Airtable rate limit hit (429). Retry after a short delay.');
      }
      throw error;
    }
  },
});
