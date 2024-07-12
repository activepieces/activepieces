import {
  DropdownOption,
  DynamicPropsValue,
  PiecePropValueSchema,
  Property,
} from '@activepieces/pieces-framework';
import { gristAuth } from '../..';
import { GristAPIClient } from './helpers';

export const commonProps = {
  workspace_id: Property.Dropdown({
    displayName: 'Workspace',
    refreshers: [],
    required: true,
    options: async ({ auth }) => {
      if (!auth) {
        return {
          disabled: true,
          placeholder: 'Please connect account first.',
          options: [],
        };
      }

      const authValue = auth as PiecePropValueSchema<typeof gristAuth>;

      const client = new GristAPIClient({
        domainUrl: authValue.domain,
        apiKey: authValue.apiKey,
      });

      const response = await client.listWorkspaces('current');

      const options: DropdownOption<number>[] = [];
      for (const workspace of response) {
        options.push({ label: workspace.name, value: workspace.id });
      }

      return {
        disabled: false,
        options,
      };
    },
  }),
  document_id: Property.Dropdown({
    displayName: 'Document',
    refreshers: ['workspace_id'],
    required: true,
    options: async ({ auth, workspace_id }) => {
      if (!auth || !workspace_id) {
        return {
          disabled: true,
          placeholder: 'Please connect account and select workspace.',
          options: [],
        };
      }

      const authValue = auth as PiecePropValueSchema<typeof gristAuth>;

      const client = new GristAPIClient({
        domainUrl: authValue.domain,
        apiKey: authValue.apiKey,
      });

      const response = await client.getWorkspace(
        workspace_id as unknown as number
      );

      const options: DropdownOption<string>[] = [];
      for (const document of response.docs) {
        options.push({ label: document.name, value: document.id });
      }

      return {
        disabled: false,
        options,
      };
    },
  }),
  table_id: Property.Dropdown({
    displayName: 'Table',
    refreshers: ['document_id'],
    required: true,
    options: async ({ auth, document_id }) => {
      if (!auth || !document_id) {
        return {
          disabled: true,
          placeholder: 'Please connect account and select document.',
          options: [],
        };
      }

      const authValue = auth as PiecePropValueSchema<typeof gristAuth>;

      const client = new GristAPIClient({
        domainUrl: authValue.domain,
        apiKey: authValue.apiKey,
      });

      const response = await client.listDocumentTables(
        document_id as unknown as string
      );

      const options: DropdownOption<string>[] = [];
      for (const table of response.tables) {
        options.push({ label: table.id, value: table.id });
      }

      return {
        disabled: false,
        options,
      };
    },
  }),
  table_columns: Property.DynamicProperties({
    displayName: 'Table Columns',
    refreshers: ['document_id', 'table_id'],
    required: true,
    props: async ({ auth, document_id, table_id }) => {
      if (!auth) return {};
      if (!document_id) return {};
      if (!table_id) return {};

      const fields: DynamicPropsValue = {};

      const authValue = auth as PiecePropValueSchema<typeof gristAuth>;

      const client = new GristAPIClient({
        domainUrl: authValue.domain,
        apiKey: authValue.apiKey,
      });

      const response = await client.listTableColumns(
        document_id as unknown as string,
        table_id as unknown as string
      );

      for (const column of response.columns) {
        if (!column.fields.isFormula) {
          switch (column.fields.type) {
            case 'Any':
              fields[column.id] = Property.ShortText({
                displayName: column.fields.label || column.id,
                required: false,
              });
              break;
            case 'Attachments':
              fields[column.id] = Property.Array({
                displayName: column.fields.label || column.id,
                description: `Use the **Upload Attachments to Document** action and provide the attachment ID from the response.`,
                required: false,
              });
              break;
            case 'Bool':
              fields[column.id] = Property.Checkbox({
                displayName: column.fields.label || column.id,
                required: false,
              });
              break;
            case 'Choice':
            case 'ChoiceList': {
              let options = [];
              try {
                const optionsObject = JSON.parse(column.fields.widgetOptions);
                options = optionsObject['choices'] as any[];
              } catch (error) {
                options = [];
              }

              const dropdownConfig = {
                displayName: column.fields.label || column.id,
                required: false,
                options: {
                  disabled: false,
                  options: options.map((choice) => {
                    return {
                      label: choice,
                      value: choice,
                    };
                  }),
                },
              };

              fields[column.id] =
                column.fields.type === 'Choice'
                  ? Property.StaticDropdown(dropdownConfig)
                  : Property.StaticMultiSelectDropdown(dropdownConfig);
              break;
            }
            case 'Date':
              fields[column.id] = Property.DateTime({
                displayName: column.fields.label || column.id,
                required: false,
              });
              break;
            case 'Int':
            case 'Numeric':
              fields[column.id] = Property.Number({
                displayName: column.fields.label || column.id,
                required: false,
              });
              break;
            case 'Text':
              fields[column.id] = Property.LongText({
                displayName: column.fields.label || column.id,
                required: false,
              });
              break;
            default:
              if (column.fields.type.startsWith('DateTime')) {
                fields[column.id] = Property.DateTime({
                  displayName: column.fields.label || column.id,
                  required: false,
                });
              } else if (column.fields.type.startsWith('RefList')) {
                const refTable = column.fields.type.split(':')[1];
                fields[column.id] = Property.Array({
                  displayName: column.fields.label || column.id,
                  description: refTable
                    ? `Please provide the row ID from the reference table ${refTable}.`
                    : '',
                  required: false,
                });
              } else if (column.fields.type.startsWith('Ref')) {
                const refTable = column.fields.type.split(':')[1];
                fields[column.id] = Property.Number({
                  displayName: column.fields.label || column.id,
                  description: refTable
                    ? `Please provide the row ID from the reference table ${refTable}.`
                    : '',
                  required: false,
                });
              }
              break;
          }
        }
      }

      return fields;
    },
  }),
  readiness_column: Property.Dropdown({
    displayName: 'Readiness Column',
    description: `A toggle (boolean) column which is True when the record is ready. The trigger will only be activated when that record becomes ready.Please follow [guideline](https://support.getgrist.com/integrators/#readiness-column) to create readiness column in table.`,
    refreshers: ['document_id', 'table_id'],
    required: false,
    options: async ({ auth, document_id, table_id }) => {
      if (!auth || !document_id || !table_id) {
        return {
          disabled: true,
          placeholder: 'Please connect account and select document.',
          options: [],
        };
      }

      const authValue = auth as PiecePropValueSchema<typeof gristAuth>;

      const client = new GristAPIClient({
        domainUrl: authValue.domain,
        apiKey: authValue.apiKey,
      });

      const response = await client.listTableColumns(
        document_id as string,
        table_id as string
      );

      const options: DropdownOption<string>[] = [];
      for (const column of response.columns) {
        if (column.fields.type === 'Bool') {
          options.push({ value: column.id, label: column.fields.label });
        }
      }
      return {
        disabled: false,
        options,
      };
    },
  }),
};
