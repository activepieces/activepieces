import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { gristAuth } from '../../auth';
import { GristAPIClient } from '../../common/helpers';
import { commonProps } from '../../common/props';
import { gristRunSqlQueryOutputSchema } from '../../output-schemas';

export const gristRunSqlQueryAction = createAction({
  auth: gristAuth,
  name: 'grist_run_sql_query',
  outputSchema: gristRunSqlQueryOutputSchema,
  displayName: 'Run SQL Query',
  description: 'Runs a read-only SQL SELECT query against a document.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Runs a SQLite SELECT statement against a Grist document (table IDs are SQL table names) and returns rows shaped as `{fields: {...}}`. Use `?` placeholders with Arguments. Read-only; use it for joins and aggregates that **List Records** cannot do.',
    idempotent: true,
  },
  props: {
    documentId: commonProps.document_id_text,
    sql: Property.LongText({
      displayName: 'SQL',
      description: 'A single SELECT statement.',
      required: true,
    }),
    args: Property.Array({
      displayName: 'Arguments',
      description: 'Values for the `?` placeholders, in order.',
      required: false,
    }),
    timeout: Property.Number({
      displayName: 'Timeout (ms)',
      required: false,
    }),
  },
  async run(context) {
    const client = new GristAPIClient({
      domainUrl: context.auth.props.domain,
      apiKey: context.auth.props.apiKey,
    });
    const { documentId, sql, args, timeout } = context.propsValue;
    const response = await client.makeRequest<{
      records: { fields: Record<string, unknown> }[];
    }>(HttpMethod.POST, `/docs/${documentId}/sql`, undefined, undefined, {
      sql,
      ...(args && args.length > 0 ? { args } : {}),
      ...(timeout ? { timeout } : {}),
    });
    return { rows: response.records, count: response.records.length };
  },
});
