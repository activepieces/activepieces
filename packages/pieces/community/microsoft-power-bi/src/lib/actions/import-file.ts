import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import FormData from 'form-data';
import { getPowerBiBaseUrl, getMicrosoftCloudFromAuth } from '../common/microsoft-cloud';
import { powerBiProps } from '../common/props';
import { microsoftPowerBiAuth } from '../auth';

export const importFileAction = createAction({
  auth: microsoftPowerBiAuth,
  name: 'import_pbix',
  displayName: 'Import File (.pbix)',
  description: 'Uploads a Power BI Desktop (.pbix), Excel (.xlsx), or RDL file into a workspace, creating a new dataset and report.',
  audience: 'both',
  aiMetadata: {
    description: 'Imports a .pbix, .xlsx, or .rdl file into a Power BI workspace, publishing it as a new dataset (and report, unless skipped). Use this to deploy a report/dataset built elsewhere. Not idempotent unless Name Conflict is set to Abort or Overwrite: by default a repeated call creates another copy.',
    idempotent: false,
  },
  props: {
    workspace_id: powerBiProps.workspaceIdDropdown,
    file: Property.File({
      displayName: 'File',
      description: 'The .pbix, .xlsx, or .rdl file to import.',
      required: true,
    }),
    dataset_display_name: Property.ShortText({
      displayName: 'Dataset Display Name',
      description: 'The display name for the imported dataset, including its file extension (e.g. "MyReport.pbix"). Defaults to the uploaded file\'s name.',
      required: false,
    }),
    name_conflict: Property.StaticDropdown<NameConflictMode>({
      displayName: 'On Name Conflict',
      description: 'What to do if a dataset with the same name already exists in the workspace.',
      required: false,
      defaultValue: 'Ignore',
      options: {
        options: [
          { label: 'Create a new copy (Ignore)', value: 'Ignore' },
          { label: 'Cancel the import (Abort)', value: 'Abort' },
          { label: 'Replace the existing dataset (Overwrite)', value: 'Overwrite' },
          { label: 'Replace, or create if none exists (CreateOrOverwrite)', value: 'CreateOrOverwrite' },
          { label: 'Generate a unique name (GenerateUniqueName)', value: 'GenerateUniqueName' },
        ],
      },
    }),
    skip_report: Property.Checkbox({
      displayName: 'Skip Report Import',
      description: 'Only import the dataset, skipping the report. Only applies to .pbix files.',
      required: false,
      defaultValue: false,
    }),
    max_wait_seconds: Property.Number({
      displayName: 'Max Wait Time (seconds)',
      description: 'How long to keep polling for the import to finish before returning its current status.',
      required: false,
      defaultValue: 120,
    }),
  },
  async run(context) {
    const auth = context.auth;
    const workspaceId = context.propsValue.workspace_id;
    const file = context.propsValue.file;
    const nameConflict = context.propsValue.name_conflict ?? 'Ignore';
    const skipReport = context.propsValue.skip_report;
    const maxWaitSeconds = context.propsValue.max_wait_seconds ?? 120;
    const datasetDisplayName = context.propsValue.dataset_display_name || file.filename;

    const cloud = getMicrosoftCloudFromAuth(auth);
    const scopedUrl = powerBiProps.getWorkspaceScopedUrl({ baseUrl: getPowerBiBaseUrl(cloud), workspaceId });
    const authHeaders = { Authorization: `Bearer ${auth.access_token}` };

    const formData = new FormData();
    formData.append('file', file.data, file.filename);

    const importResponse = await httpClient.sendRequest<ImportJob>({
      method: HttpMethod.POST,
      url: `${scopedUrl}/imports`,
      headers: {
        ...authHeaders,
        ...formData.getHeaders(),
        'Content-Length': formData.getLengthSync().toString(),
      },
      queryParams: {
        datasetDisplayName,
        nameConflict,
        ...(skipReport ? { skipReport: 'true' } : {}),
      },
      body: formData,
    });

    let importJob = importResponse.body;
    const deadline = Date.now() + maxWaitSeconds * 1000;
    while (importJob.importState !== 'Succeeded' && importJob.importState !== 'Failed' && Date.now() < deadline) {
      await sleep(3000);
      const statusResponse = await httpClient.sendRequest<ImportJob>({
        method: HttpMethod.GET,
        url: `${scopedUrl}/imports/${importJob.id}`,
        headers: authHeaders,
      });
      importJob = statusResponse.body;
    }

    if (importJob.importState === 'Failed') {
      throw new Error(`Power BI import ${importJob.id} failed.`);
    }

    if (importJob.importState !== 'Succeeded') {
      throw new Error(`Import did not finish within ${maxWaitSeconds} seconds (last status: ${importJob.importState ?? 'unknown'}).`);
    }

    return {
      importId: importJob.id,
      importState: importJob.importState,
      datasets: importJob.datasets ?? [],
      reports: importJob.reports ?? [],
    };
  },
});

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

type NameConflictMode = 'Ignore' | 'Abort' | 'Overwrite' | 'CreateOrOverwrite' | 'GenerateUniqueName';

type ImportState = 'Publishing' | 'Succeeded' | 'Failed';

type ImportJob = {
  id: string;
  importState: ImportState;
  datasets?: { id: string; name: string }[];
  reports?: { id: string; name: string }[];
};
