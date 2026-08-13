import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { getPowerBiBaseUrl, getMicrosoftCloudFromAuth } from '../common/microsoft-cloud';
import { powerBiProps } from '../common/props';
import { microsoftPowerBiAuth } from '../auth';

export const listReportsAction = createAction({
  auth: microsoftPowerBiAuth,
  name: 'list_reports',
  displayName: 'List Reports',
  description: 'Lists all reports in a Power BI workspace.',
  audience: 'both',
  aiMetadata: {
    description: 'Lists every report in a Power BI workspace, including each report\'s ID, dataset ID, and web/embed URLs. Use this to discover which reports exist before exporting, cloning, or otherwise referencing one by ID. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    workspace_id: powerBiProps.workspaceIdDropdown,
  },
  async run(context) {
    const auth = context.auth;
    const workspaceId = context.propsValue.workspace_id;

    const cloud = getMicrosoftCloudFromAuth(auth);
    const scopedUrl = powerBiProps.getWorkspaceScopedUrl({ baseUrl: getPowerBiBaseUrl(cloud), workspaceId });

    const response = await httpClient.sendRequest<{ value: PowerBiReport[] }>({
      method: HttpMethod.GET,
      url: `${scopedUrl}/reports`,
      headers: {
        Authorization: `Bearer ${auth.access_token}`,
      },
    });

    return response.body.value.map((report) => ({
      id: report.id,
      name: report.name,
      description: report.description,
      report_type: report.reportType,
      dataset_id: report.datasetId,
      web_url: report.webUrl,
      embed_url: report.embedUrl,
    }));
  },
});

type PowerBiReport = {
  id: string;
  name: string;
  description?: string;
  reportType?: string;
  datasetId?: string;
  webUrl?: string;
  embedUrl?: string;
};
