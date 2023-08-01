import { Property } from '@activepieces/pieces-framework';
import { Table, TableColumn, Workspace } from './types';
import { getTableColumns, getTables, getWorkSpaces } from './data';

export const promaProps = {
  table_name: (required = false) =>
    Property.ShortText({ displayName: 'Master Sheet Name', required }),
  acl: (required = false) =>
    Property.StaticDropdown({
      displayName: 'Access',
      required,
      defaultValue: 'private',
      options: {
        disabled: false,
        placeholder: '',
        options: [
          { label: 'Private', value: 'private' },
          { label: 'Public', value: 'public' },
          { label: 'Inherit from workspace', value: 'inherit' },
        ],
      },
    }),
  column_name: (required = false) =>
    Property.ShortText({ displayName: 'Column Name', required }),
  column_data_type: (required = false) =>
    Property.StaticDropdown({
      displayName: 'Column Data Type',
      required,
      options: {
        disabled: false,
        placeholder: 'Select data type',
        options: [
          { label: 'text', value: 'text' },
          { label: 'number', value: 'number' },
          { label: 'email', value: 'email' },
          { label: 'url', value: 'url' },
          { label: 'time', value: 'time' },
          { label: 'date', value: 'date' },
          { label: 'image', value: 'image' },
          { label: 'select', value: 'select' },
          { label: 'multiSelect', value: 'multiSelect' },
          { label: 'file', value: 'file' },
          { label: 'tel', value: 'tel' },
          { label: 'team members', value: 'teamMembers' },
        ],
      },
    }),
  workspace_id: (required = false, mode = 'read') =>
    Property.Dropdown({
      displayName: 'Workspace',
      description: "The workspace's unique identifier.",
      required: required,
      refreshers: ['auth'],
      options: async ({ auth }) => {
        if (!auth)
          return {
            disabled: true,
            placeholder: 'connect your account first',
            options: [],
          };

        const response: Workspace[] | null = await getWorkSpaces(
          auth as string,
          mode as string
        );

        if (!response)
          return {
            disabled: true,
            placeholder: 'Invalid API key',
            options: [],
          };

        const options = (response || []).map((el) => ({
          label: el.name,
          value: el.ROWID,
        }));

        return {
          disabled: false,
          options: options,
        };
      },
    }),
  table_id: (required = false, mode = 'read') =>
    Property.Dropdown({
      displayName: 'Master Sheet',
      description: '',
      required: required,
      refreshers: ['auth', 'workspace_id'],
      options: async ({ auth, workspace_id }) => {
        if (!auth)
          return {
            disabled: true,
            placeholder: 'connect your account first',
            options: [],
          };
        if (!workspace_id)
          return {
            disabled: true,
            placeholder: 'select a workspace first',
            options: [],
          };

        const response: Table[] | null = await getTables(
          auth as string,
          workspace_id as string,
          mode
        );

        if (!response)
          return {
            disabled: true,
            placeholder: 'Invalid API key',
            options: [],
          };

        const options = (response || []).map((el) => ({
          label: el.name,
          value: el.ROWID,
        }));

        return {
          disabled: false,
          options: options,
        };
      },
    }),
  column_id: (required = false, label?: string, dataType?: string) =>
    Property.Dropdown({
      displayName: label || 'Column Name',
      description: '',
      required: required,
      refreshers: ['api_key', 'table_id'],
      options: async ({ api_key, table_id }) => {
        if (!api_key)
          return {
            disabled: true,
            placeholder: 'connect your account first',
            options: [],
          };
        if (!table_id)
          return {
            disabled: true,
            placeholder: 'select a master sheet first',
            options: [],
          };

        const response: TableColumn[] | null = await getTableColumns(
          api_key as string,
          table_id as string
        );

        if (!response)
          return {
            disabled: true,
            placeholder: 'Invalid API key',
            options: [],
          };

        const options = (response || [])
          .filter((el) => (dataType ? el.dataType === dataType : true))
          .map((el) => ({
            label: el.columnNmae,
            value: el.ROWID,
          }));

        return {
          disabled: false,
          options: options,
        };
      },
    }),
  data_row: (required = false) =>
    Property.Object({
      displayName: 'Enter data',
      required,
      defaultValue: {},
      description: 'Enter column name on left and its value on right',
    }),
  row_id: (required = false) =>
    Property.ShortText({ displayName: 'Row ID', required, description: '' }),
};
