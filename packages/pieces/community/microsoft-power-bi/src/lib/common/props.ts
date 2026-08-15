import { Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { getMicrosoftCloudFromAuth, getPowerBiBaseUrl } from './microsoft-cloud';
import { microsoftPowerBiAuth } from '../auth';

const MY_WORKSPACE_VALUE = '';

function asOptionalString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

function getWorkspaceScopedUrl({
  baseUrl,
  workspaceId,
}: {
  baseUrl: string;
  workspaceId: string | undefined;
}): string {
  return workspaceId ? `${baseUrl}/groups/${workspaceId}` : baseUrl;
}

const workspaceIdDropdown = Property.Dropdown({
  displayName: 'Workspace',
  description: 'The Power BI workspace to use. Defaults to "My workspace" (your personal workspace).',
  auth: microsoftPowerBiAuth,
  required: true,
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
      const response = await httpClient.sendRequest<{ value: PowerBiGroup[] }>({
        method: HttpMethod.GET,
        url: `${getPowerBiBaseUrl(cloud)}/groups`,
        headers: {
          Authorization: `Bearer ${auth.access_token}`,
        },
      });

      return {
        disabled: false,
        options: [
          { label: 'My workspace', value: MY_WORKSPACE_VALUE },
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

function buildDatasetIdDropdown({ workspacePropName }: { workspacePropName: string }) {
  return Property.Dropdown({
    displayName: 'Dataset',
    description: 'Select a dataset from the chosen workspace.',
    auth: microsoftPowerBiAuth,
    required: true,
    refreshers: ['auth', workspacePropName],
    options: async (propsValue) => {
      const auth = propsValue['auth'];
      const workspaceId = asOptionalString(propsValue[workspacePropName]);
      if (!auth) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Please authenticate first.',
        };
      }

      try {
        const cloud = getMicrosoftCloudFromAuth(auth);
        const scopedUrl = getWorkspaceScopedUrl({ baseUrl: getPowerBiBaseUrl(cloud), workspaceId });
        const response = await httpClient.sendRequest<{ value: PowerBiDataset[] }>({
          method: HttpMethod.GET,
          url: `${scopedUrl}/datasets`,
          headers: {
            Authorization: `Bearer ${auth.access_token}`,
          },
        });

        return {
          disabled: false,
          options: response.body.value.map((dataset) => ({ label: dataset.name, value: dataset.id })),
        };
      } catch (error) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Error loading datasets',
        };
      }
    },
  });
}

function buildReportIdDropdown({ workspacePropName }: { workspacePropName: string }) {
  return Property.Dropdown({
    displayName: 'Report',
    description: 'Select a report from the chosen workspace.',
    auth: microsoftPowerBiAuth,
    required: true,
    refreshers: ['auth', workspacePropName],
    options: async (propsValue) => {
      const auth = propsValue['auth'];
      const workspaceId = asOptionalString(propsValue[workspacePropName]);
      if (!auth) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Please authenticate first.',
        };
      }

      try {
        const cloud = getMicrosoftCloudFromAuth(auth);
        const scopedUrl = getWorkspaceScopedUrl({ baseUrl: getPowerBiBaseUrl(cloud), workspaceId });
        const response = await httpClient.sendRequest<{ value: PowerBiReport[] }>({
          method: HttpMethod.GET,
          url: `${scopedUrl}/reports`,
          headers: {
            Authorization: `Bearer ${auth.access_token}`,
          },
        });

        return {
          disabled: false,
          options: response.body.value.map((report) => ({ label: report.name, value: report.id })),
        };
      } catch (error) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Error loading reports',
        };
      }
    },
  });
}

export const powerBiProps = {
  MY_WORKSPACE_VALUE,
  getWorkspaceScopedUrl,
  asOptionalString,
  workspaceIdDropdown,
  buildDatasetIdDropdown,
  buildReportIdDropdown,
};

type PowerBiGroup = {
  id: string;
  name: string;
};

type PowerBiDataset = {
  id: string;
  name: string;
};

type PowerBiReport = {
  id: string;
  name: string;
};
