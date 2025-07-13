import { Property } from '@activepieces/pieces-framework';
import { makeRequest } from './client';
import { HttpMethod } from '@activepieces/pieces-common';

export const teamidDropdown = Property.Dropdown({
  displayName: 'Team ID',
  description: 'Select the team containing the database',
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
      const teams = await makeRequest(auth as string, HttpMethod.GET, '/teams');
      return {
        disabled: false,
        options: teams.map((team: any) => ({
          label: team.name,
          value: team.id,
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

export const databaseIdDropdown = Property.Dropdown({
  displayName: 'Database ID',
  description: 'Select the database containing the table',
  required: true,
  refreshers: ['teamid'],
  options: async ({ auth, teamid }) => {
    if (!auth || !teamid) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Please select a team first',
      };
    }

    try {
      const databases = await makeRequest(
        auth as string,
        HttpMethod.GET,
        `/teams/${teamid}/databases`
      );
      return {
        disabled: false,
        options: databases.map((db: any) => ({
          label: db.name,
          value: db.id,
        })),
      };
    } catch (error) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Error loading databases',
      };
    }
  },
});

export const tableIdDropdown = Property.Dropdown({
  displayName: 'Table ID',
  description: 'Select the table',
  required: true,
  refreshers: ['teamid', 'dbid'],
  options: async ({ auth, teamid, dbid }) => {
    if (!auth || !teamid || !dbid) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Please select a database first',
      };
    }

    try {
      const tables = await makeRequest(
        auth as string,
        HttpMethod.GET,
        `/teams/${teamid}/databases/${dbid}/tables`
      );

      return {
        disabled: false,
        options: tables.map((table: any) => ({
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
  description: 'Select the record to update/delete',
  required: true,
  refreshers: ['teamid', 'dbid', 'tid'],
  options: async ({ auth, teamid, dbid, tid }) => {
    if (!auth || !teamid || !dbid || !tid) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Please select a table first',
      };
    }

    try {
      const records = await makeRequest(
        auth as string,
        HttpMethod.GET,
        `/teams/${teamid}/databases/${dbid}/tables/${tid}/records`
      );
      return {
        disabled: false,
        options: records.map((record: any) => ({
          label: `Record ${record.id}`,
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

// // Dynamic field properties for create/update operations
export const createDynamicFields = Property.DynamicProperties({
  displayName: 'Record Fields',
  description: 'Configure the fields for the record',
  required: true,
  refreshers: ['teamid', 'dbid', 'tid'],
  props: async ({ auth, teamid, dbid, tid }) => {
    if (!auth || !teamid || !dbid || !tid) {
      return {};
    }

    try {
      // 1. Get the table schema (all possible fields)
      const tableSchemaResponse = await makeRequest(
        auth as unknown as string,
        HttpMethod.GET,
        `/teams/${teamid}/databases/${dbid}/tables/${tid}`
      );
      const schemaFields = tableSchemaResponse.fields || [];

      const fields: Record<string, any> = {};

      // 2. For each field in the schema, create an empty property
      for (const field of schemaFields) {
        const fieldName = field.name;
        const fieldType = field.type; // You may need to map Ninox types to Property types

        if (fieldName === 'id' || fieldName === '_id') continue;

        // Map Ninox field types to Property types
        switch (fieldType) {
          case 'TEXT':
          case 'FORMULA':
          case 'URL':
          case 'EMAIL':
          case 'PHONE':
            fields[fieldName] = Property.ShortText({
              displayName: fieldName,
              description: `Enter value for ${fieldName}`,
              required: false,
              defaultValue: '',
            });
            break;
          case 'NUMBER':
          case 'CURRENCY':
          case 'PERCENT':
            fields[fieldName] = Property.Number({
              displayName: fieldName,
              description: `Enter value for ${fieldName}`,
              required: false,
              defaultValue: undefined,
            });
            break;
          case 'BOOLEAN':
            fields[fieldName] = Property.Checkbox({
              displayName: fieldName,
              description: `Select value for ${fieldName}`,
              required: false,
              defaultValue: false,
            });
            break;
          default:
            fields[fieldName] = Property.ShortText({
              displayName: fieldName,
              description: `Enter value for ${fieldName}`,
              required: false,
              defaultValue: '',
            });
        }
      }

      return fields;
    } catch (error) {
      // Fallback: generic fields
      return {
        Name: Property.ShortText({
          displayName: 'Name',
          description: 'Enter name',
          required: false,
        }),
        Email: Property.ShortText({
          displayName: 'Email',
          description: 'Enter email',
          required: false,
        }),
        Status: Property.Checkbox({
          displayName: 'Status',
          description: 'Active status',
          required: false,
        }),
      };
    }
  },
});



export const updateDynamicFields = Property.DynamicProperties({
  displayName: 'Update Fields',
  description: 'Select which fields to update and their new values',
  required: true,
  refreshers: ['teamid', 'dbid', 'tid', 'rid'],
  props: async ({ auth, teamid, dbid, tid, rid }) => {
    if (!auth || !teamid || !dbid || !tid || !rid) {
      return {};
    }

    try {
      // 1. Get the table schema (all possible fields)
      const tableSchemaResponse = await makeRequest(
        auth as unknown as string,
        HttpMethod.GET,
        `/teams/${teamid}/databases/${dbid}/tables/${tid}`
      );
      const schemaFields = (tableSchemaResponse.fields || []).map((f: any) => f.name);

      // 2. Get the specific record to understand its current values
      const response = await makeRequest(
        auth as unknown as string,
        HttpMethod.GET,
        `/teams/${teamid}/databases/${dbid}/tables/${tid}/records/${rid}`
      );
      const record = response.fields || {};

      const fields: Record<string, any> = {};

      // 3. For each field in the schema, show the value from the record or empty
      for (const fieldName of schemaFields) {
        if (fieldName === 'id' || fieldName === '_id') continue;
        const fieldValue = record[fieldName];
        const fieldType = typeof fieldValue;
        // If the field is not present in the record, we can't infer its type from value, so fallback to string
        switch (fieldType) {
          case 'string':
            fields[fieldName] = Property.ShortText({
              displayName: fieldName,
              description: `Current: "${fieldValue ?? ''}". Enter new value:`,
              required: false,
              defaultValue: fieldValue ?? '',
            });
            break;
          case 'number':
            fields[fieldName] = Property.Number({
              displayName: fieldName,
              description: `Current: ${fieldValue ?? ''}. Enter new value:`,
              required: false,
              defaultValue: fieldValue ?? undefined,
            });
            break;
          case 'boolean':
            fields[fieldName] = Property.Checkbox({
              displayName: fieldName,
              description: `Current: ${fieldValue ?? false}. Select new value:`,
              required: false,
              defaultValue: fieldValue ?? false,
            });
            break;
          default:
            // If the field is not present in the record, treat as string
            fields[fieldName] = Property.ShortText({
              displayName: fieldName,
              description: `Current: "${fieldValue ?? ''}". Enter new value:`,
              required: false,
              defaultValue: fieldValue ?? '',
            });
        }
      }

      return fields;
    } catch (error) {
      return {
        Name: Property.ShortText({
          displayName: 'Name',
          description: 'Enter new name value',
          required: false,
        }),
        Email: Property.ShortText({
          displayName: 'Email',
          description: 'Enter new email value',
          required: false,
        }),
        Status: Property.Checkbox({
          displayName: 'Status',
          description: 'Select new status',
          required: false,
        }),
      };
    }
  },
});



export const tablefieldDropdown=Property.Dropdown({
  displayName: 'Table Field',
  description: 'Select the table fiels',
  required: true,
  refreshers: ['teamid', 'dbid','tid'],
  options: async ({ auth, teamid, dbid, tid }) => {
    if (!auth || !teamid || !dbid) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Please select a database first',
      };
    }

    try {
      // 1. Get the table schema (all possible fields)
      const tableSchemaResponse = await makeRequest(
        auth as unknown as string,
        HttpMethod.GET,
        `/teams/${teamid}/databases/${dbid}/tables/${tid}`
      );
      const schemaFields = (tableSchemaResponse.fields || []).map((f: any) => f.name);
      console.log(schemaFields)
      return {
        disabled: false,
        options: schemaFields.map((record: any) => ({
          label: record,
          value: record,
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
})