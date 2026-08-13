import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { getPowerBiBaseUrl, getMicrosoftCloudFromAuth } from '../common/microsoft-cloud';
import { powerBiProps } from '../common/props';
import { microsoftPowerBiAuth } from '../auth';

export const exportReportToFileAction = createAction({
  auth: microsoftPowerBiAuth,
  name: 'export_report_to_file',
  displayName: 'Export Report to File',
  description: 'Exports a Power BI report to a PDF, PPTX, or PNG file.',
  audience: 'both',
  aiMetadata: {
    description: 'Exports a Power BI report to a PDF, PowerPoint, or PNG file and returns the downloaded file. This is an asynchronous job under the hood: the action polls until the export finishes before returning, so it can take a while for large reports. Requires the report\'s workspace to be on Premium, Embedded, or Fabric capacity (not supported on Premium Per User). Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    workspace_id: powerBiProps.workspaceIdDropdown,
    report_id: powerBiProps.buildReportIdDropdown({ workspacePropName: 'workspace_id' }),
    file_format: Property.StaticDropdown<FileFormat, true>({
      displayName: 'File Format',
      description: 'The format to export the report to.',
      required: true,
      defaultValue: 'PDF',
      options: {
        options: [
          { label: 'PDF', value: 'PDF' },
          { label: 'PowerPoint (PPTX)', value: 'PPTX' },
          { label: 'PNG', value: 'PNG' },
        ],
      },
    }),
    max_wait_seconds: Property.Number({
      displayName: 'Max Wait Time (seconds)',
      description: 'How long to keep polling for the export to finish before giving up.',
      required: false,
      defaultValue: 300,
    }),
  },
  async run(context) {
    const auth = context.auth;
    const workspaceId = context.propsValue.workspace_id;
    const reportId = context.propsValue.report_id;
    const fileFormat = context.propsValue.file_format;
    const maxWaitSeconds = context.propsValue.max_wait_seconds ?? 300;

    const cloud = getMicrosoftCloudFromAuth(auth);
    const scopedUrl = powerBiProps.getWorkspaceScopedUrl({ baseUrl: getPowerBiBaseUrl(cloud), workspaceId });
    const authHeaders = { Authorization: `Bearer ${auth.access_token}` };

    let exportJob: ExportJob;
    try {
      const exportResponse = await httpClient.sendRequest<ExportJob>({
        method: HttpMethod.POST,
        url: `${scopedUrl}/reports/${reportId}/ExportTo`,
        headers: authHeaders,
        body: { format: fileFormat },
      });
      exportJob = exportResponse.body;
    } catch (error) {
      const message = extractErrorMessage(error);
      if (isLikelyPremiumCapacityError(message)) {
        throw new Error(
          'Export To File requires the report\'s workspace to be on a Premium, Embedded, or Fabric capacity (it is not supported on Premium Per User / PPU). ' +
          `Original error: ${message}`
        );
      }
      throw new Error(`Failed to start report export: ${message}`);
    }

    const deadline = Date.now() + maxWaitSeconds * 1000;
    while (exportJob.status === 'NotStarted' || exportJob.status === 'Running') {
      if (Date.now() > deadline) {
        throw new Error(`Export did not finish within ${maxWaitSeconds} seconds (last status: ${exportJob.status}, ${exportJob.percentComplete ?? 0}% complete).`);
      }
      await sleep(3000);
      const statusResponse = await httpClient.sendRequest<ExportJob>({
        method: HttpMethod.GET,
        url: `${scopedUrl}/reports/${reportId}/exports/${exportJob.id}`,
        headers: authHeaders,
      });
      exportJob = statusResponse.body;
    }

    if (exportJob.status !== 'Succeeded') {
      throw new Error(
        `Report export failed. This usually means the workspace is not on a Premium, Embedded, or Fabric capacity (Export To File is not supported on Premium Per User / PPU), ` +
        'or the report uses an unsupported visual. See https://learn.microsoft.com/en-us/power-bi/developer/embedded/export-to#considerations-and-limitations'
      );
    }

    const fileResponse = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${scopedUrl}/reports/${reportId}/exports/${exportJob.id}/file`,
      headers: authHeaders,
      responseType: 'arraybuffer',
    });

    const extension = exportJob.resourceFileExtension ?? `.${fileFormat.toLowerCase()}`;
    const filename = `${exportJob.reportName ?? 'report'}${extension}`;

    const file = await context.files.write({
      fileName: filename,
      data: Buffer.from(fileResponse.body),
    });

    return {
      file,
      filename,
      format: fileFormat,
      exportId: exportJob.id,
      status: exportJob.status,
    };
  },
});

const PREMIUM_REQUIRED_HINTS = ['premium', 'capacity', 'embedded', 'fabric', 'license', 'ppu'];

function isLikelyPremiumCapacityError(message: string): boolean {
  const normalized = message.toLowerCase();
  return PREMIUM_REQUIRED_HINTS.some((hint) => normalized.includes(hint));
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isHttpErrorLike(error: unknown): error is HttpErrorLike {
  return typeof error === 'object' && error !== null && 'response' in error;
}

function extractErrorMessage(error: unknown): string {
  if (isHttpErrorLike(error)) {
    const apiError = error.response?.body?.error;
    if (apiError) {
      return apiError.message ?? apiError.code ?? 'Unknown error';
    }
  }
  return error instanceof Error ? error.message : String(error);
}

type FileFormat = 'PDF' | 'PPTX' | 'PNG';

type ExportStatus = 'NotStarted' | 'Running' | 'Succeeded' | 'Failed' | 'Undefined';

type ExportJob = {
  id: string;
  status: ExportStatus;
  percentComplete?: number;
  reportName?: string;
  resourceFileExtension?: string;
};

type HttpErrorLike = {
  response?: {
    body?: {
      error?: {
        message?: string;
        code?: string;
      };
    };
  };
};
