import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import {
  bigQueryAuth,
  BigQueryAuthValue,
  BASE_URL,
  BQField,
  BQRow,
  bigQueryRowsToFlat,
  getAccessToken,
  projectIdProp,
  waitForJobResults,
} from '../common';

interface QueryResponse {
  jobComplete: boolean;
  schema?: { fields: BQField[] };
  rows?: BQRow[];
  pageToken?: string;
  totalRows?: string;
  totalBytesProcessed?: string;
  cacheHit?: boolean;
  jobReference: { projectId: string; jobId: string; location?: string };
}

export const runQueryAction = createAction({
  auth: bigQueryAuth,
  name: 'run_query',
  displayName: 'Run a Query',
  description:
    'Execute a SQL query on BigQuery and return the results as flat rows',
  props: {
    project_id: projectIdProp,
    query: Property.LongText({
      displayName: 'SQL Query',
      description:
        'The SQL query to run. Uses standard SQL syntax. Example: `SELECT * FROM \\`my_dataset.my_table\\` LIMIT 100`',
      required: true,
    }),
    max_results: Property.Number({
      displayName: 'Max Rows',
      description: 'Maximum number of rows to return (up to 10,000)',
      required: false,
      defaultValue: 1000,
    }),
    location: Property.ShortText({
      displayName: 'Location',
      description:
        'Geographic location of your dataset (e.g. US, EU, us-central1). Leave blank for US.',
      required: false,
    }),
    use_legacy_sql: Property.Checkbox({
      displayName: 'Use Legacy SQL',
      description:
        'Enable only if your query uses BigQuery Legacy SQL syntax (not recommended)',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const { project_id, query, max_results, location, use_legacy_sql } =
      context.propsValue;
    const limit = Math.min((max_results as number) ?? 1000, 10000);
    const token = await getAccessToken(context.auth as BigQueryAuthValue);

    // Submit synchronous query (waits up to 10 seconds before returning)
    const initialResponse = await httpClient.sendRequest<QueryResponse>({
      method: HttpMethod.POST,
      url: `${BASE_URL}/projects/${project_id}/queries`,
      headers: { Authorization: `Bearer ${token}` },
      body: {
        query,
        useLegacySql: use_legacy_sql ?? false,
        maxResults: Math.min(limit, 1000),
        timeoutMs: 10000,
        ...(location ? { location } : {}),
      },
    });

    let result = initialResponse.body;
    let schema: BQField[] = result.schema?.fields ?? [];

    // If job is still running, poll until it completes
    if (!result.jobComplete) {
      const jobId = result.jobReference.jobId;
      const polled = await waitForJobResults(
        token,
        project_id as string,
        jobId,
        (location as string) ?? undefined
      );
      result = {
        ...polled,
        jobReference: { projectId: project_id as string, jobId },
      };
      schema = polled.schema?.fields ?? schema;
    }

    // Collect all rows, paginating if needed
    const allRows: BQRow[] = [...(result.rows ?? [])];
    let pageToken = result.pageToken;

    while (pageToken && allRows.length < limit) {
      const remaining = limit - allRows.length;
      const pageResponse = await httpClient.sendRequest<QueryResponse>({
        method: HttpMethod.GET,
        url: `${BASE_URL}/projects/${project_id}/queries/${result.jobReference.jobId}`,
        headers: { Authorization: `Bearer ${token}` },
        queryParams: {
          pageToken,
          maxResults: String(Math.min(remaining, 1000)),
          ...(location ? { location } : {}),
        },
      });
      allRows.push(...(pageResponse.body.rows ?? []));
      pageToken = pageResponse.body.pageToken;
    }

    const rows = bigQueryRowsToFlat(schema, allRows.slice(0, limit));

    return {
      rows,
      row_count: rows.length,
      total_rows: parseInt(result.totalRows ?? '0', 10),
      bytes_processed: result.totalBytesProcessed ?? '0',
      job_id: result.jobReference?.jobId ?? null,
      cache_hit: result.cacheHit ?? false,
    };
  },
});
