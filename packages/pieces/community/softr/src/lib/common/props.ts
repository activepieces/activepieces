import { DynamicPropsValue, Property } from '@activepieces/pieces-framework';
import { makeRequest } from './client';
import { HttpMethod } from '@activepieces/pieces-common';

export const databaseIdDropdown = Property.Dropdown({
  displayName: 'Database ID',
  description: 'Select the database to insert the record into',
  required: true,
  refreshers: [],
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Please connect your account first',
      };
    }

    try {
      const databases = await makeRequest(
        auth as string,
        HttpMethod.GET,
        '/databases'
      );
      return {
        disabled: false,
        options: databases.data.map((database: any) => ({
          label: database.name,
          value: database.id,
        })),
      };
    } catch (error) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Error loading teams',
      };
    }
  },
});

export const tableIdDropdown = Property.Dropdown({
  displayName: 'Table ID',
  description: 'Select the table to insert the record into',
  required: true,
  refreshers: ['auth', 'databaseId'],
  options: async ({ auth, databaseId }) => {
    if (!auth || !databaseId) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Please connect your account and select a database first',
      };
    }

    try {
      const tables = await makeRequest(
        auth as string,
        HttpMethod.GET,
        `/databases/${databaseId}/tables`
      );
      return {
        disabled: false,
        options: tables.data.map((table: any) => ({
          label: table.name,
          value: table.id,
        })),
      };
    } catch (error) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Error loading tables',
      };
    }
  },
});

export const recordIdDropdown = Property.Dropdown({
  displayName: 'Record ID',

  description: 'Select the record to update',
  required: true,
  refreshers: ['auth', 'databaseId', 'tableId'],
  options: async ({ auth, databaseId, tableId }) => {
    if (!auth || !databaseId || !tableId) {
      return {
        disabled: true,
        options: [],
        placeholder:
          'Please connect your account and select a database and table first',
      };
    }

    try {
      const records = await makeRequest(
        auth as string,
        HttpMethod.GET,
        `/databases/${databaseId}/tables/${tableId}/records`
      );
      return {
        disabled: false,
        options: records.data.map((record: any) => ({
          label: record.id,
          value: record.id,
        })),
      };
    } catch (error) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Error loading records',
      };
    }
  },
});

export const getdynamicfields = Property.DynamicProperties({
  displayName: 'Fields',
  description: 'The fields to create in the record',
  required: true,
  refreshers: ['auth', 'databaseId', 'tableId'],
  props: async ({ auth, databaseId, tableId }) => {
    if (!databaseId || !tableId) {
      return {};
    }

    try {
      const response = await makeRequest(
        auth as unknown as string,
        HttpMethod.GET,
        `/databases/${databaseId}/tables/${tableId}`
      );

      const tableData = response.data || response;
      const fields = tableData.fields || [];
      const dynamicProps: DynamicPropsValue = {};

      fields.forEach((field: any) => {
        // Skip readonly fields
        if (field.readonly) {
          return;
        }

        const fieldId = field.id;
        const fieldName = field.name || fieldId;
        const fieldType = field.type;
        const isRequired = field.required || false;

        // Create appropriate property based on field type
        switch (fieldType?.toLowerCase()) {
          case 'text':
          case 'email':
          case 'url':
          case 'phone':
            dynamicProps[fieldId] = Property.ShortText({
              displayName: fieldName,
              description: `${fieldType} field`,
              required: isRequired,
              defaultValue: field.defaultValue || undefined,
            });
            break;

          case 'long_text':
          case 'rich_text':
            dynamicProps[fieldId] = Property.LongText({
              displayName: fieldName,
              description: `${fieldType} field`,
              required: isRequired,
              defaultValue: field.defaultValue || undefined,
            });
            break;

          case 'number':
          case 'currency':
          case 'percent':
            dynamicProps[fieldId] = Property.Number({
              displayName: fieldName,
              description: `${fieldType} field`,
              required: isRequired,
              defaultValue: field.defaultValue
                ? Number(field.defaultValue)
                : undefined,
            });
            break;
          case 'checkbox':
          case 'boolean':
            dynamicProps[fieldId] = Property.Checkbox({
              displayName: fieldName,
              description: `${fieldType} field`,
              required: isRequired,
              defaultValue:
                field.defaultValue === 'true' || field.defaultValue === true,
            });
            break;

          case 'date':
          case 'datetime':
            dynamicProps[fieldId] = Property.DateTime({
              displayName: fieldName,
              description: `${fieldType} field`,
              required: isRequired,
              defaultValue: field.defaultValue || undefined,
            });
            break;

          case 'file':
          case 'attachment':
            dynamicProps[fieldId] = Property.File({
              displayName: fieldName,
              description: `${fieldType} field`,
              required: isRequired,
            });
            break;
          default:
            // Fallback to short text for unknown field types
            dynamicProps[fieldId] = Property.ShortText({
              displayName: fieldName,
              description: `${fieldType || 'Unknown'} field`,
              required: isRequired,
              defaultValue: field.defaultValue || undefined,
            });
            break;
        }
      });

      return dynamicProps;
    } catch (error) {
      console.error('Error fetching table fields:', error);
      return {};
    }
  },
});
