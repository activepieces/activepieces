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
} from '../common';

interface QueryResultsResponse {
  jobComplete: boolean;
  schema?: { fields: BQField[] };
  rows?: BQRow[];
  pageToken?: string;
  totalRows?: string;
  totalBytesProcessed?: string;
  cacheHit?: boolean;
}

export const getRowsForJobAction = createAction({
  auth: bigQueryAuth,
  name: 'get_rows_for_job',
  displayName: 'Get Rows for Job Completed',
  description:
    'Retrieves the result rows from a completed BigQuery query job by Job ID. Use this after a "Query Job Completed" trigger to fetch the full result set.',
  props: {
    project_id: projectIdProp,
    job_id: Property.ShortText({
      displayName: 'Job ID',
      description:
        'The BigQuery job ID to fetch results for. This is returned by the "Query Job Completed" trigger or a "Run a Query" action.',
      required: true,
    }),
    max_results: Property.Number({
      displayName: 'Max Rows',
      description:
        'Maximum number of rows to return (up to 10,000). Default: 1,000.',
      required: false,
      defaultValue: 1000,
    }),
    location: Property.ShortText({
      displayName: 'Location',
      description:
        'Dataset location where the job ran (e.g. US, EU). Leave blank for US.',
      required: false,
    }),
  },
  async run(context) {
    const { project_id, job_id, max_results, location } = context.propsValue;
    const limit = Math.min((max_results as number) ?? 1000, 10000);
    const token = await getAccessToken(context.auth as BigQueryAuthValue);

    const allRows: BQRow[] = [];
    let schema: BQField[] = [];
    let pageToken: string | undefined;
    let totalRows = '0';
    let bytesProcessed = '0';
    let cacheHit = false;

    do {
      const remaining = limit - allRows.length;
      const response = await httpClient.sendRequest<QueryResultsResponse>({
        method: HttpMethod.GET,
        url: `${BASE_URL}/projects/${project_id}/queries/${job_id}`,
        headers: { Authorization: `Bearer ${token}` },
        queryParams: {
          maxResults: String(Math.min(remaining, 1000)),
          timeoutMs: '10000',
          ...(pageToken ? { pageToken } : {}),
          ...(location ? { location } : {}),
        },
      });

      const body = response.body;
      if (!body.jobComplete) {
        throw new Error(
          `Job ${job_id} has not completed yet. Wait for the job to finish before fetching results.`
        );
      }

      if (body.schema?.fields) schema = body.schema.fields;
      allRows.push(...(body.rows ?? []));
      pageToken = body.pageToken;
      totalRows = body.totalRows ?? totalRows;
      bytesProcessed = body.totalBytesProcessed ?? bytesProcessed;
      cacheHit = body.cacheHit ?? cacheHit;
    } while (pageToken && allRows.length < limit);

    const rows = bigQueryRowsToFlat(schema, allRows.slice(0, limit));

    return {
      rows,
      row_count: rows.length,
      total_rows: parseInt(totalRows, 10),
      bytes_processed: bytesProcessed,
      cache_hit: cacheHit,
      job_id,
    };
  },
});
