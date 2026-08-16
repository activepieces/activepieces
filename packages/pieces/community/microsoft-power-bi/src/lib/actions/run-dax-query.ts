import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { getPowerBiBaseUrl, getMicrosoftCloudFromAuth } from '../common/microsoft-cloud';
import { powerBiProps } from '../common/props';
import { microsoftPowerBiAuth } from '../auth';

export const runDaxQueryAction = createAction({
  auth: microsoftPowerBiAuth,
  name: 'run_dax_query',
  displayName: 'Run DAX Query',
  description: 'Executes a DAX (Data Analysis Expressions) query against a Power BI dataset and returns the resulting rows.',
  audience: 'both',
  aiMetadata: {
    description: 'Runs a single read-only DAX query against a Power BI dataset and returns the result rows. Use this to pull specific values or a table out of a dataset without exporting a whole report. Only one query per call and one table per query are supported, up to 100,000 rows or 15MB. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    workspace_id: powerBiProps.workspaceIdDropdown,
    dataset_id: powerBiProps.buildDatasetIdDropdown({ workspacePropName: 'workspace_id' }),
    dax_query: Property.LongText({
      displayName: 'DAX Query',
      description: 'The DAX query to run, e.g. "EVALUATE VALUES(MyTable)" or "EVALUATE TOPN(10, MyTable)". Only DAX is supported (no MDX/DMV).',
      required: true,
    }),
    impersonated_user_name: Property.ShortText({
      displayName: 'Impersonated User (UPN)',
      description: 'Optional. The user principal name (e.g. "jane@contoso.com") to impersonate for row-level security. Ignored if the dataset has no RLS roles.',
      required: false,
    }),
    include_nulls: Property.Checkbox({
      displayName: 'Include Null Values',
      description: 'Whether blank/null values should be included in the result rows.',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const auth = context.auth;
    const workspaceId = context.propsValue.workspace_id;
    const datasetId = context.propsValue.dataset_id;
    const daxQuery = context.propsValue.dax_query;
    const impersonatedUserName = context.propsValue.impersonated_user_name;
    const includeNulls = context.propsValue.include_nulls;

    const cloud = getMicrosoftCloudFromAuth(auth);
    const scopedUrl = powerBiProps.getWorkspaceScopedUrl({ baseUrl: getPowerBiBaseUrl(cloud), workspaceId });

    try {
      const response = await httpClient.sendRequest<ExecuteQueriesResponse>({
        method: HttpMethod.POST,
        url: `${scopedUrl}/datasets/${datasetId}/executeQueries`,
        headers: {
          Authorization: `Bearer ${auth.access_token}`,
        },
        body: {
          queries: [{ query: daxQuery }],
          serializerSettings: { includeNulls: !!includeNulls },
          ...(impersonatedUserName ? { impersonatedUserName } : {}),
        },
      });

      const result = response.body.results?.[0];
      if (result?.error) {
        throw new Error(`DAX query failed: ${result.error.message ?? result.error.code}`);
      }

      const table = result?.tables?.[0];
      if (table?.error) {
        throw new Error(`DAX query failed: ${table.error.message ?? table.error.code}`);
      }

      return table?.rows ?? [];
    } catch (error) {
      if (isHttpErrorWithBody(error)) {
        const apiError = error.response.body?.error;
        if (apiError) {
          throw new Error(`DAX query failed: ${apiError.message ?? apiError.code}`);
        }
      }
      throw error;
    }
  },
});

function isHttpErrorWithBody(error: unknown): error is { response: { body?: { error?: DaxQueryError } } } {
  return typeof error === 'object' && error !== null && 'response' in error;
}

type DaxQueryError = {
  code: string;
  message?: string;
};

type DaxQueryTableResult = {
  rows: Record<string, unknown>[];
  error?: DaxQueryError;
};

type DaxQueryResult = {
  tables?: DaxQueryTableResult[];
  error?: DaxQueryError;
};

type ExecuteQueriesResponse = {
  results: DaxQueryResult[];
  error?: DaxQueryError;
};
