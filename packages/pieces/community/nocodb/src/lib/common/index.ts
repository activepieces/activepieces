import { nocodbAuth } from '../../';
import {
  DynamicPropsValue,
  AppConnectionValueForAuthProperty,
  Property,
} from '@activepieces/pieces-framework';
import { NocoDBClient } from './client';
import {
  ColumnResponse,
  ColumnV3Response,
  GetTableResponse,
  GetTableV3Response,
} from './types';

export function makeClient(auth: AppConnectionValueForAuthProperty<typeof nocodbAuth>) {
  return new NocoDBClient(auth.props.baseUrl, auth.props.apiToken);
}

export const nocodbCommon = {
  workspaceId: Property.Dropdown({
 auth:nocodbAuth,
    displayName: 'Workspace ID',
    refreshers: [],
    required: false,
    description: 'For self-hosted instances,select "No Workspace".',
    options: async ({ auth }) => {
      if (!auth) {
        return {
          disabled: true,
          placeholder: 'Please connect your account first.',
          options: [],
        };
      }

      const client = makeClient(
        auth 
      );
      try {
        const response = await client.listWorkspaces();
        return {
          disabled: false,
          options: response.list.map((workspace) => {
            return {
              label: workspace.title,
              value: workspace.id,
            };
          }),
        };
      } catch (error) {
        return {
          disabled: false,
          options: [
            {
              label: 'No Workspace',
              value: 'none',
            },
          ],
        };
      }
    },
  }),
  baseId: Property.Dropdown({
 auth:nocodbAuth,
    displayName: 'Base ID',
    refreshers: ['workspaceId'],
    required: true,
    options: async ({ auth, workspaceId }) => {
      if (!auth) {
        return {
          disabled: true,
          placeholder: 'Please connect your account first.',
          options: [],
        };
      }

      try {
        const client = makeClient(
          auth 
        );
        const response = await client.listBases(
          (workspaceId as string) || undefined,
          (auth).props.version || 3
        );

        return {
          disabled: false,
          options: response.list.map((base) => {
            return {
              label: base.title,
              value: base.id,
            };
          }),
        };
      } catch (error) {
        console.error('Error fetching bases:', error);
        return {
          disabled: true,
          placeholder:
            'Error fetching bases. Please check your connection and version.',
          options: [],
        };
      }
    },
  }),
  tableId: Property.Dropdown({
 auth:nocodbAuth,
    displayName: 'Table ID',
    refreshers: ['workspaceId', 'baseId'],
    required: true,
    options: async ({ auth, baseId }) => {
      if (!auth || !baseId) {
        return {
          disabled: true,
          placeholder: 'Please connect your account first and select base.',
          options: [],
        };
      }

      const client = makeClient(
        auth 
      );
      const response = await client.listTables(
        baseId as string,
        (auth ).props.version || 3
      );

      return {
        disabled: false,
        options: response.list.map((table) => {
          return {
            label: table.title,
            value: table.id,
          };
        }),
      };
    },
  }),
  columnId: Property.MultiSelectDropdown({
    auth:nocodbAuth,
    displayName: 'Fields',
    description:
      'Allows you to specify the fields that you wish to include in your API response. By default, all the fields are included in the response.',
    refreshers: ['workspaceId', 'baseId', 'tableId'],
    required: false,
    options: async ({ auth, baseId, tableId }) => {
      if (!auth || !baseId || !tableId) {
        return {
          disabled: true,
          placeholder: 'Please connect your account first and select base.',
          options: [],
        };
      }

      const client = makeClient(
        auth 
      );
      const authVersion =
        (auth ).props.version || 3;
      const response =
        authVersion === 4
          ? await client.getTableV3(
              baseId as unknown as string,
              tableId as unknown as string,
              authVersion
            )
          : await client.getTable(
              baseId as unknown as string,
              tableId as unknown as string,
              authVersion
            );

      return {
        disabled: false,
        options:
          authVersion === 4
            ? (response as GetTableV3Response).fields.map((field) => {
                return {
                  label: field.title,
                  value: field.title,
                };
              })
            : (response as GetTableResponse).columns.map((column) => {
                return {
                  label: column.title,
                  value: column.title,
                };
              }),
      };
    },
  }),
  tableColumns: Property.DynamicProperties({
    auth:nocodbAuth,
    displayName: 'Table Columns',
    refreshers: ['baseId', 'tableId'],
    required: true,
    props: async ({ auth, baseId, tableId }) => {
      if (!auth) return {};
      if (!baseId) return {};
      if (!tableId) return {};

      const fields: DynamicPropsValue = {};

      const client = makeClient(
        auth 
      );
      const authVersion =
        (auth ).props.version || 3;
      const response =
        authVersion === 4
          ? await client.getTableV3(
              baseId as unknown as string,
              tableId as unknown as string,
              authVersion
            )
          : await client.getTable(
              baseId as unknown as string,
              tableId as unknown as string,
              authVersion
            );

      const columns =
        authVersion === 4
          ? (response as GetTableV3Response).fields
          : (response as GetTableResponse).columns;

      for (const column of (columns ?? [])) {
        const uidt =
          authVersion === 4
            ? (column as ColumnV3Response).type
            : (column as ColumnResponse).uidt;

        switch (uidt) {
          case 'SingleLineText':
          case 'PhoneNumber':
          case 'Email':
          case 'URL':
            fields[column.title] = Property.ShortText({
              displayName: column.title,
              required: false,
            });
            break;
          case 'LongText':
            fields[column.title] = Property.LongText({
              displayName: column.title,
              required: false,
            });
            break;
          case 'Number':
          case 'Decimal':
          case 'Percent':
          case 'Rating':
          case 'Currency':
          case 'Year':
            fields[column.title] = Property.Number({
              displayName: column.title,
              required: false,
            });
            break;
          case 'Checkbox':
            fields[column.title] = Property.Checkbox({
              displayName: column.title,
              required: true,
            });
            break;
          case 'MultiSelect': {
            const getOptionsForAuthVersion4 = () => {
              const colOptions = (column as ColumnV3Response).options;
              return (colOptions?.['choices'] as any[])?.map((option) => {
                return {
                  label: option.title,
                  value: option.title,
                };
              });
            };
            const options =
              authVersion === 4
                ? getOptionsForAuthVersion4()
                : (column as ColumnResponse).colOptions?.options?.map(
                    (option) => {
                      return {
                        label: option.title,
                        value: option.title,
                      };
                    }
                  );
            fields[column.title] = Property.StaticMultiSelectDropdown({
              displayName: column.title,
              required: false,
              options: {
                disabled: false,
                options: options ?? [],
              },
            });
            break;
          }
          case 'SingleSelect': {
            const getOptionsForAuthVersion4 = () => {
              const colOptions = (column as ColumnV3Response).options;
              return (colOptions?.['choices'] as any[])?.map((option) => {
                return {
                  label: option.title,
                  value: option.title,
                };
              });
            };
            const options =
              authVersion === 4
                ? getOptionsForAuthVersion4()
                : (column as ColumnResponse).colOptions?.options?.map(
                    (option) => {
                      return {
                        label: option.title,
                        value: option.title,
                      };
                    }
                  );
            fields[column.title] = Property.StaticDropdown({
              displayName: column.title,
              required: false,
              options: {
                disabled: false,
                options: options ?? [],
              },
            });
            break;
          }
          case 'Date':{
						const columnMeta = authVersion === 4 ? 
							(column as ColumnV3Response).options:
							(column as ColumnResponse).meta;
            fields[column.title] = Property.ShortText({
              displayName: column.title,
              required: false,
              description: columnMeta?.['date_format']
                ? `Please provide date in ${columnMeta['date_format']} format.`
                : '',
            });
            break;}
          case 'Time':
            fields[column.title] = Property.ShortText({
              displayName: column.title,
              required: false,
              description: 'Please provide time in HH:mm:ss format.',
            });
            break;
          case 'DateTime':
            fields[column.title] = Property.DateTime({
              displayName: column.title,
              required: false,
            });
            break;
          case 'JSON':
            fields[column.title] = Property.Json({
              displayName: column.title,
              required: false,
            });
            break;
          default:
            fields[column.title] = Property.ShortText({
              displayName: column.title,
              required: false,
            });
            break;
        }
      }

      return fields;
    },
  }),
};
