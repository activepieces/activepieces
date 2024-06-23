import { Property, DynamicPropsValue } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';

import {
  RetableFieldMapping,
  RetableField,
  RetableNotSupportedFields,
  RetableWorkspace,
  RetableProject,
  RetableTable,
} from './models';
import { isNil } from '@activepieces/shared';

export const retableCommon = {
  baseUrl: 'https://api.retable.io/v1/public',
  workspace_id: (required = true) =>
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
        const response = await httpClient.sendRequest<{
          data: {
            workspaces: RetableWorkspace[];
          };
        }>({
          method: HttpMethod.GET,
          url: `${retableCommon.baseUrl}/workspace`,
          headers: {
            ApiKey: auth as string,
          },
        });
        return {
          disabled: false,
          options: response.body.data.workspaces.map((workspace) => {
            return {
              label: workspace.name,
              value: workspace.id,
            };
          }),
        };
      },
    }),
  project_id: (required = true) =>
    Property.Dropdown({
      displayName: 'Project',
      required,
      refreshers: ['workspace_id'],
      options: async ({ auth, workspace_id }) => {
        if (!auth || !workspace_id) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Please connect your account and select workspace',
          };
        }

        const response = await httpClient.sendRequest<{
          data: {
            projects: RetableProject[];
          };
        }>({
          method: HttpMethod.GET,
          url: `${retableCommon.baseUrl}/workspace/${
            workspace_id as string
          }/project`,
          headers: {
            ApiKey: auth as string,
          },
        });
        return {
          disabled: false,
          options: response.body.data.projects.map((project) => {
            return {
              label: project.name,
              value: project.id,
            };
          }),
        };
      },
    }),
  retable_id: (required = true) =>
    Property.Dropdown({
      displayName: 'Retable',
      required,
      refreshers: ['project_id'],
      options: async ({ auth, project_id }) => {
        if (!auth || !project_id) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Please connect your account and select project',
          };
        }
        const response = await httpClient.sendRequest<{
          data: {
            retables: RetableTable[];
          };
        }>({
          method: HttpMethod.GET,
          url: `${retableCommon.baseUrl}/project/${
            project_id as string
          }/retable`,
          headers: {
            ApiKey: auth as string,
          },
        });
        return {
          disabled: false,
          options: response.body.data.retables.map((retable) => {
            return {
              label: retable.title,
              value: retable.id,
            };
          }),
        };
      },
    }),
  fields: Property.DynamicProperties({
    displayName: 'Fields',
    required: true,
    refreshers: ['retable_id'],
    props: async ({ auth, retable_id }) => {
      if (!auth || !retable_id) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Please connect your account and select retable',
        };
      }
      const fields: DynamicPropsValue = {};
      const retable = await httpClient.sendRequest<{ data: RetableTable }>({
        method: HttpMethod.GET,
        url: `${retableCommon.baseUrl}/retable/${retable_id}`,
        headers: {
          ApiKey: auth as unknown as string,
        },
      });
      retable.body.data.columns.forEach((field: RetableField) => {
        if (!RetableNotSupportedFields.includes(field.type)) {
          const params = {
            displayName: field.title,
            required: false,
          };
          if (isNil(RetableFieldMapping[field.type])) {
            fields[field.column_id] = Property.ShortText({
              ...params,
            });
          } else {
            fields[field.column_id] = RetableFieldMapping[field.type](params);
          }
        }
      });
      return fields;
    },
  }),
};
