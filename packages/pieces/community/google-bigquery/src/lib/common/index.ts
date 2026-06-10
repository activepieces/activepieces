import { AppConnectionType } from '@activepieces/shared';
import {
  AppConnectionValueForAuthProperty,
  OAuth2PropertyValue,
  PieceAuth,
  Property,
} from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { google } from 'googleapis';

export const BASE_URL = 'https://bigquery.googleapis.com/bigquery/v2';

export const bigQueryScopes = ['https://www.googleapis.com/auth/bigquery'];

export const bigQueryAuth = [
  PieceAuth.OAuth2({
    description:
      'Sign in with your Google account. If you are using your own OAuth2 credentials, make sure to include the following scope: `https://www.googleapis.com/auth/bigquery`',
    authUrl: 'https://accounts.google.com/o/oauth2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    required: true,
    scope: bigQueryScopes,
  }),
  PieceAuth.CustomAuth({
    displayName: 'Service Account',
    description:
      'Use a GCP service account for automated, server-to-server access — no user sign-in required. Recommended for production workflows.',
    required: true,
    props: {
      instructions: Property.MarkDown({
        value: `**How to create a service account key:**

1. Open [Google Cloud Console](https://console.cloud.google.com/) and select your project from the top dropdown.
2. Go to **IAM & Admin** → **Service Accounts** in the left sidebar.
3. Click **Create Service Account** (or open an existing one).
4. Give it a name (e.g. \`activepieces-bigquery\`) and click **Create and Continue**.
5. Under **Grant this service account access**, add the **BigQuery User** role (or **BigQuery Admin** for full access). Click **Done**.
6. Click on the service account you just created, then open the **Keys** tab.
7. Click **Add Key** → **Create new key** → select **JSON** → click **Create**.
8. A \`.json\` file will download — open it in a text editor and paste the entire contents into the field below.`,
      }),
      serviceAccountJson: Property.ShortText({
        displayName: 'Service Account JSON',
        description:
          'Paste the full contents of the downloaded .json key file here',
        required: true,
      }),
    },
    validate: async ({ auth }) => {
      try {
        const parsed = JSON.parse(auth.serviceAccountJson);
        if (!parsed.client_email || !parsed.private_key) {
          return {
            valid: false,
            error:
              'Service account JSON must contain "client_email" and "private_key" fields',
          };
        }
        const jwtClient = new google.auth.JWT({
          email: parsed.client_email,
          key: parsed.private_key,
          scopes: bigQueryScopes,
        });
        const response = await jwtClient.getAccessToken();
        if (!response.token) throw new Error('Empty token returned');
        return { valid: true };
      } catch (e) {
        return {
          valid: false,
          error: `Service account authentication failed: ${
            (e as Error).message
          }`,
        };
      }
    },
  }),
];

export type BigQueryAuthValue = AppConnectionValueForAuthProperty<
  typeof bigQueryAuth
>;

export async function getAccessToken(auth: BigQueryAuthValue): Promise<string> {
  if (auth.type === AppConnectionType.CUSTOM_AUTH) {
    const parsed = JSON.parse(auth.props.serviceAccountJson);
    const jwtClient = new google.auth.JWT({
      email: parsed.client_email,
      key: parsed.private_key,
      scopes: bigQueryScopes,
    });
    const response = await jwtClient.getAccessToken();
    if (response.token) return response.token;
    throw new Error(
      'Could not retrieve access token from service account JSON'
    );
  }
  return (auth as OAuth2PropertyValue).access_token;
}

// ---------------------------------------------------------------------------
// Shared dropdown props
// ---------------------------------------------------------------------------

export const projectIdProp = Property.Dropdown<
  string,
  true,
  typeof bigQueryAuth
>({
  auth: bigQueryAuth,
  displayName: 'Project',
  description: 'Select your Google Cloud project',
  refreshers: [],
  required: true,
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Please connect your account first',
      };
    }
    try {
      const token = await getAccessToken(auth as BigQueryAuthValue);
      const response = await httpClient.sendRequest<{
        projects?: Array<{
          id: string;
          projectReference: { projectId: string };
          friendlyName?: string;
        }>;
      }>({
        method: HttpMethod.GET,
        url: `${BASE_URL}/projects`,
        headers: { Authorization: `Bearer ${token}` },
        queryParams: { maxResults: '200' },
      });
      const projects = response.body.projects ?? [];
      return {
        disabled: false,
        options: projects.map((p) => ({
          label: p.friendlyName
            ? `${p.friendlyName} (${p.projectReference.projectId})`
            : p.projectReference.projectId,
          value: p.projectReference.projectId,
        })),
      };
    } catch {
      return {
        disabled: true,
        options: [],
        placeholder: 'Failed to load projects. Check your connection.',
      };
    }
  },
});

export const datasetIdProp = Property.Dropdown<
  string,
  true,
  typeof bigQueryAuth
>({
  auth: bigQueryAuth,
  displayName: 'Dataset',
  description: 'Select the BigQuery dataset',
  refreshers: ['project_id'],
  required: true,
  options: async ({ auth, project_id }) => {
    if (!auth || !project_id) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Please select a project first',
      };
    }
    try {
      const token = await getAccessToken(auth as BigQueryAuthValue);
      const datasets: Array<{ label: string; value: string }> = [];
      let pageToken: string | undefined;
      do {
        const response = await httpClient.sendRequest<{
          datasets?: Array<{
            datasetReference: { datasetId: string };
            friendlyName?: string;
          }>;
          nextPageToken?: string;
        }>({
          method: HttpMethod.GET,
          url: `${BASE_URL}/projects/${project_id}/datasets`,
          headers: { Authorization: `Bearer ${token}` },
          queryParams: {
            maxResults: '200',
            ...(pageToken ? { pageToken } : {}),
          },
        });
        for (const ds of response.body.datasets ?? []) {
          datasets.push({
            label: ds.friendlyName ?? ds.datasetReference.datasetId,
            value: ds.datasetReference.datasetId,
          });
        }
        pageToken = response.body.nextPageToken;
      } while (pageToken);
      return { disabled: false, options: datasets };
    } catch {
      return {
        disabled: true,
        options: [],
        placeholder: 'Failed to load datasets. Check your project selection.',
      };
    }
  },
});

export const tableIdProp = Property.Dropdown<string, true, typeof bigQueryAuth>(
  {
    auth: bigQueryAuth,
    displayName: 'Table',
    description: 'Select the BigQuery table',
    refreshers: ['project_id', 'dataset_id'],
    required: true,
    options: async ({ auth, project_id, dataset_id }) => {
      if (!auth || !project_id || !dataset_id) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Please select a project and dataset first',
        };
      }
      try {
        const token = await getAccessToken(auth as BigQueryAuthValue);
        const tables: Array<{ label: string; value: string }> = [];
        let pageToken: string | undefined;
        do {
          const response = await httpClient.sendRequest<{
            tables?: Array<{
              tableReference: { tableId: string };
              friendlyName?: string;
              type?: string;
            }>;
            nextPageToken?: string;
          }>({
            method: HttpMethod.GET,
            url: `${BASE_URL}/projects/${project_id}/datasets/${dataset_id}/tables`,
            headers: { Authorization: `Bearer ${token}` },
            queryParams: {
              maxResults: '200',
              ...(pageToken ? { pageToken } : {}),
            },
          });
          for (const tbl of response.body.tables ?? []) {
            const label = tbl.friendlyName
              ? `${tbl.friendlyName} (${tbl.tableReference.tableId})`
              : tbl.tableReference.tableId;
            tables.push({ label, value: tbl.tableReference.tableId });
          }
          pageToken = response.body.nextPageToken;
        } while (pageToken);
        return { disabled: false, options: tables };
      } catch {
        return {
          disabled: true,
          options: [],
          placeholder: 'Failed to load tables. Check your dataset selection.',
        };
      }
    },
  }
);

// ---------------------------------------------------------------------------
// BigQuery row format utilities
// ---------------------------------------------------------------------------

export interface BQField {
  name: string;
  type: string;
  mode?: string;
  fields?: BQField[];
}

export interface BQRow {
  f: Array<{ v: unknown }>;
}

/**
 * Converts BigQuery query result rows (f[].v format) into flat key/value objects
 * ready for spreadsheet mapping. Nested RECORD fields are JSON-stringified.
 * REPEATED fields are joined as comma-separated strings.
 */
export function bigQueryRowsToFlat(
  fields: BQField[],
  rows: BQRow[]
): Record<string, string | number | boolean | null>[] {
  return rows.map((row) => {
    const obj: Record<string, string | number | boolean | null> = {};
    fields.forEach((field, i) => {
      const value = row.f[i]?.v;
      if (value === null || value === undefined) {
        obj[field.name] = null;
      } else if (Array.isArray(value)) {
        // REPEATED mode — array of { v: ... } cells
        obj[field.name] = (value as Array<{ v: unknown }>)
          .map((cell) =>
            typeof cell.v === 'object'
              ? JSON.stringify(cell.v)
              : String(cell.v ?? '')
          )
          .join(', ');
      } else if (typeof value === 'object') {
        // RECORD (nested struct) — serialize as JSON string
        obj[field.name] = JSON.stringify(value);
      } else {
        obj[field.name] = value as string | number | boolean;
      }
    });
    return obj;
  });
}

/**
 * Fetches a table's schema fields from the BigQuery API.
 */
export async function getTableSchema(
  token: string,
  projectId: string,
  datasetId: string,
  tableId: string
): Promise<BQField[]> {
  const response = await httpClient.sendRequest<{
    schema?: { fields: BQField[] };
  }>({
    method: HttpMethod.GET,
    url: `${BASE_URL}/projects/${projectId}/datasets/${datasetId}/tables/${tableId}`,
    headers: { Authorization: `Bearer ${token}` },
    queryParams: { fields: 'schema' },
  });
  return response.body.schema?.fields ?? [];
}

/**
 * Submits a DML query (DELETE / UPDATE / INSERT) as a BigQuery job,
 * polls until DONE, and returns the DML statistics.
 */
export async function runDmlQuery(
  token: string,
  projectId: string,
  query: string,
  location?: string
): Promise<{
  jobId: string;
  affectedRowCount: number;
  deletedRowCount: number;
  updatedRowCount: number;
  insertedRowCount: number;
}> {
  // Submit via jobs.query (supports DML, waits up to 10 s synchronously)
  const submitResp = await httpClient.sendRequest<{
    jobComplete: boolean;
    jobReference: { projectId: string; jobId: string };
  }>({
    method: HttpMethod.POST,
    url: `${BASE_URL}/projects/${projectId}/queries`,
    headers: { Authorization: `Bearer ${token}` },
    body: {
      query,
      useLegacySql: false,
      timeoutMs: 10000,
      ...(location ? { location } : {}),
    },
  });

  const jobId = submitResp.body.jobReference.jobId;

  // Poll jobs.get until DONE (up to 2 minutes)
  for (let i = 0; i < 60; i++) {
    const jobResp = await httpClient.sendRequest<{
      status: { state: string; errorResult?: { message: string } };
      statistics?: {
        query?: {
          dmlStats?: {
            deletedRowCount?: string;
            updatedRowCount?: string;
            insertedRowCount?: string;
          };
        };
      };
    }>({
      method: HttpMethod.GET,
      url: `${BASE_URL}/projects/${projectId}/jobs/${jobId}`,
      headers: { Authorization: `Bearer ${token}` },
      queryParams: { ...(location ? { location } : {}) },
    });

    if (jobResp.body.status.state === 'DONE') {
      if (jobResp.body.status.errorResult) {
        throw new Error(
          `Query failed: ${jobResp.body.status.errorResult.message}`
        );
      }
      const s = jobResp.body.statistics?.query?.dmlStats ?? {};
      const deleted = parseInt(s.deletedRowCount ?? '0', 10);
      const updated = parseInt(s.updatedRowCount ?? '0', 10);
      const inserted = parseInt(s.insertedRowCount ?? '0', 10);
      return {
        jobId,
        affectedRowCount: deleted + updated + inserted,
        deletedRowCount: deleted,
        updatedRowCount: updated,
        insertedRowCount: inserted,
      };
    }
    // 2-second pause between polls
    await new Promise((r) => setTimeout(r, 2000));
  }
  throw new Error('DML query timed out after 2 minutes.');
}

/**
 * Waits for a BigQuery job to reach DONE state by long-polling jobs.getQueryResults.
 * Returns the final response (schema + first page of rows).
 */
export async function waitForJobResults(
  token: string,
  projectId: string,
  jobId: string,
  location?: string
): Promise<{
  schema?: { fields: BQField[] };
  rows?: BQRow[];
  pageToken?: string;
  totalRows?: string;
  totalBytesProcessed?: string;
  cacheHit?: boolean;
  jobComplete: boolean;
  jobReference: { projectId: string; jobId: string };
}> {
  for (let attempt = 0; attempt < 60; attempt++) {
    const response = await httpClient.sendRequest<{
      jobComplete: boolean;
      schema?: { fields: BQField[] };
      rows?: BQRow[];
      pageToken?: string;
      totalRows?: string;
      totalBytesProcessed?: string;
      cacheHit?: boolean;
      jobReference: { projectId: string; jobId: string };
      errors?: Array<{ reason: string; message: string }>;
    }>({
      method: HttpMethod.GET,
      url: `${BASE_URL}/projects/${projectId}/queries/${jobId}`,
      headers: { Authorization: `Bearer ${token}` },
      queryParams: {
        timeoutMs: '10000',
        maxResults: '1000',
        ...(location ? { location } : {}),
      },
    });

    if (response.body.jobComplete) return response.body;
  }
  throw new Error(
    'Query did not complete within 10 minutes. Try simplifying your query or using a smaller dataset.'
  );
}
