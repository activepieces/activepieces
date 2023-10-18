import { Property, DynamicPropsValue } from '@activepieces/pieces-framework';
import {
  HttpMethod,
  AuthenticationType,
  httpClient,
  HttpRequest,
} from '@activepieces/pieces-common';

import {
  RetableFieldMapping,
  RetableField,
  RetableFieldType,
  RetableWorkspace,
  RetableProject,
  RetableTable,
} from './models';

export const retableCommon = {
  baseUrl: 'https://api.retable.io/v1/public',
  workspaceId: (required = true) =>
    Property.Dropdown({
      displayName: 'Workspace',
      required,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Please connect your account',
          };
        }
        const respone = await httpClient.sendRequest<{
          workspaces: RetableWorkspace[];
        }>({
          method: HttpMethod.GET,
          url: `${retableCommon.baseUrl}/workspace`,
          headers: {
            ApiKey: auth as string,
          },
        });
        return {
          disabled: false,
          options: respone.body.workspaces.map((workspace) => {
            return {
              label: workspace.name,
              value: workspace.id,
            };
          }),
        };
      },
    }),
  projectId: (required = true) =>
    Property.Dropdown({
      displayName: 'Project',
      required,
      refreshers: ['workspaceId'],
      options: async ({ auth, workspaceId }) => {
        if (!auth || !workspaceId) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Please connect your account and select workspace',
          };
        }
        const respone = await httpClient.sendRequest<{
          projects: RetableProject[];
        }>({
          method: HttpMethod.GET,
          url: `${retableCommon.baseUrl}/workspace/${workspaceId}/project`,
          headers: {
            ApiKey: auth as string,
          },
        });
        return {
          disabled: false,
          options: respone.body.projects.map((project) => {
            return {
              label: project.name,
              value: project.id,
            };
          }),
        };
      },
    }),
  reatbleId: (required = true) =>
    Property.Dropdown({
      displayName: 'Retable',
      required,
      refreshers: ['projectId'],
      options: async ({ auth, projectId }) => {
        if (!auth || !projectId) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Please connect your account and select project',
          };
        }
        const respone = await httpClient.sendRequest<{
          retables: RetableTable[];
        }>({
          method: HttpMethod.GET,
          url: `${retableCommon.baseUrl}/project/${projectId}/retable`,
          headers: {
            ApiKey: auth as string,
          },
        });
        return {
          disabled: false,
          options: respone.body.retables.map((retable) => {
            return {
              label: retable.title,
              value: retable.id,
            };
          }),
        };
      },
    }),
  fields: (required = true) =>
    Property.DynamicProperties({
      displayName: 'Fields',
      required,
      refreshers: ['retableId'],
      props: async ({ auth, retableId }) => {
        if (!auth || !retableId) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Please connect your account and select retable',
          };
        }
        const fields: DynamicPropsValue = {};
        const retable = await httpClient.sendRequest<RetableTable>({
          method: HttpMethod.GET,
          url: `${retableCommon.baseUrl}/retable/${retableId}`,
          headers: {
            ApiKey: auth as unknown as string,
          },
        });
        retable.body.columns.map((field: RetableField) => {
          const params = {
            displayName: field.title,
            description: ['calender'].includes(field.type)
              ? `${field.type ? field.type : ''}Expected format: mmmm d,yyyy`
              : field.type,
            required: false,
          };
          fields[field.column_id] = RetableFieldMapping[field.type](params);
        });
        return fields;
      },
    }),
};
