import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { getPowerBiBaseUrl, getMicrosoftCloudFromAuth } from '../common/microsoft-cloud';
import { powerBiProps } from '../common/props';
import { microsoftPowerBiAuth } from '../auth';

export const cloneReportAction = createAction({
  auth: microsoftPowerBiAuth,
  name: 'clone_report',
  displayName: 'Clone Report',
  description: 'Creates a copy of a Power BI report, optionally into a different workspace or bound to a different dataset.',
  audience: 'both',
  aiMetadata: {
    description: 'Clones an existing Power BI report under a new name, optionally into a different workspace and/or bound to a different dataset. Use this to duplicate a report template for a new audience instead of rebuilding it. Not idempotent: each call creates another report copy.',
    idempotent: false,
  },
  props: {
    workspace_id: powerBiProps.workspaceIdDropdown,
    report_id: powerBiProps.buildReportIdDropdown({ workspacePropName: 'workspace_id' }),
    new_report_name: Property.ShortText({
      displayName: 'New Report Name',
      description: 'The name to give the cloned report.',
      required: true,
    }),
    target_workspace_id: buildTargetWorkspaceIdDropdown(),
    target_dataset_id: Property.ShortText({
      displayName: 'Target Dataset ID',
      description: 'Optional. The ID of the dataset the cloned report should bind to (found in the dataset\'s Power BI portal URL, e.g. ".../datasets/{this-id}/details"). Leave blank to keep the source report\'s dataset.',
      required: false,
    }),
  },
  async run(context) {
    const auth = context.auth;
    const workspaceId = context.propsValue.workspace_id;
    const reportId = context.propsValue.report_id;
    const newReportName = context.propsValue.new_report_name;
    const targetWorkspaceId = context.propsValue.target_workspace_id;
    const targetDatasetId = context.propsValue.target_dataset_id;

    const cloud = getMicrosoftCloudFromAuth(auth);
    const scopedUrl = powerBiProps.getWorkspaceScopedUrl({ baseUrl: getPowerBiBaseUrl(cloud), workspaceId });

    const response = await httpClient.sendRequest<ClonedReport>({
      method: HttpMethod.POST,
      url: `${scopedUrl}/reports/${reportId}/Clone`,
      headers: {
        Authorization: `Bearer ${auth.access_token}`,
      },
      body: {
        name: newReportName,
        ...(targetWorkspaceId && targetWorkspaceId !== SAME_AS_SOURCE_WORKSPACE ? { targetWorkspaceId } : {}),
        ...(targetDatasetId ? { targetModelId: targetDatasetId } : {}),
      },
    });

    return response.body;
  },
});

function buildTargetWorkspaceIdDropdown() {
  return Property.Dropdown({
    displayName: 'Target Workspace',
    description: 'Where to place the cloned report. Defaults to the same workspace as the source report.',
    auth: microsoftPowerBiAuth,
    required: false,
    refreshers: [],
    options: async ({ auth }) => {
      if (!auth) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Please authenticate first.',
        };
      }

      try {
        const cloud = getMicrosoftCloudFromAuth(auth);
        const response = await httpClient.sendRequest<{ value: { id: string; name: string }[] }>({
          method: HttpMethod.GET,
          url: `${getPowerBiBaseUrl(cloud)}/groups`,
          headers: {
            Authorization: `Bearer ${auth.access_token}`,
          },
        });

        return {
          disabled: false,
          options: [
            { label: 'Same as source workspace', value: SAME_AS_SOURCE_WORKSPACE },
            { label: 'My workspace', value: MY_WORKSPACE_TARGET_ID },
            ...response.body.value.map((group) => ({ label: group.name, value: group.id })),
          ],
        };
      } catch (error) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Error loading workspaces',
        };
      }
    },
  });
}

const SAME_AS_SOURCE_WORKSPACE = '__same_as_source__';
const MY_WORKSPACE_TARGET_ID = '00000000-0000-0000-0000-000000000000';

type ClonedReport = {
  id: string;
  name: string;
  datasetId?: string;
  webUrl?: string;
  embedUrl?: string;
};
