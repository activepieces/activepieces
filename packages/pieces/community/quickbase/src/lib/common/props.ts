import { Property } from '@activepieces/pieces-framework';
import { QuickbaseClient } from './client';
import { QuickbaseApp, QuickbaseTable, QuickbaseField } from './types';

export const appIdProp = Property.Dropdown({
  displayName: 'App',
  description: 'Select the Quickbase app',
  required: true,
  refreshers: [],
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        placeholder: 'Please connect your account first',
        options: [],
      };
    }

    try {
      const client = new QuickbaseClient(auth as string);
      const apps = await client.get<QuickbaseApp[]>('/apps');
      
      return {
        options: apps.map(app => ({
          label: app.name,
          value: app.id,
        })),
      };
    } catch (error) {
      return {
        disabled: true,
        placeholder: 'Failed to load apps',
        options: [],
      };
    }
  },
});

export const tableIdProp = Property.Dropdown({
  displayName: 'Table',
  description: 'Select the table',
  required: true,
  refreshers: ['appId'],
  options: async ({ auth, appId }) => {
    if (!auth || !appId) {
      return {
        disabled: true,
        placeholder: 'Please select an app first',
        options: [],
      };
    }

    try {
      const client = new QuickbaseClient(auth as string);
      const tables = await client.get<QuickbaseTable[]>(`/tables?appId=${appId}`);
      
      return {
        options: tables.map(table => ({
          label: table.name,
          value: table.id,
        })),
      };
    } catch (error) {
      return {
        disabled: true,
        placeholder: 'Failed to load tables',
        options: [],
      };
    }
  },
});

export const recordIdProp = Property.ShortText({
  displayName: 'Record ID',
  description: 'The ID of the record',
  required: true,
});

export const fieldsMapperProp = Property.Object({
  displayName: 'Fields',
  description: 'Map the fields to update. Use field names or field IDs.',
  required: true,
});

export const filtersProp = Property.Object({
  displayName: 'Filters',
  description: 'Filter criteria to find records. Use field names or field IDs as keys.',
  required: false,
});

export const mergeFieldProp = Property.Dropdown({
  displayName: 'Merge Field',
  description: 'Field to use for matching existing records (for upsert operations)',
  required: true,
  refreshers: ['appId', 'tableId'],
  options: async ({ auth, appId, tableId }) => {
    if (!auth || !appId || !tableId) {
      return {
        disabled: true,
        placeholder: 'Please select app and table first',
        options: [],
      };
    }

    try {
      const client = new QuickbaseClient(auth as string);
      const fields = await client.get<QuickbaseField[]>(`/fields?tableId=${tableId}`);
      
      return {
        options: fields
          .filter(field => field.unique || field.type === 'text' || field.type === 'email')
          .map(field => ({
            label: field.label,
            value: field.id.toString(),
          })),
      };
    } catch (error) {
      return {
        disabled: true,
        placeholder: 'Failed to load fields',
        options: [],
      };
    }
  },
});

export const recordsArrayProp = Property.Array({
  displayName: 'Records',
  description: 'Array of records to create or update',
  required: true,
});

export const pollingIntervalProp = Property.Number({
  displayName: 'Polling Interval (minutes)',
  description: 'How often to check for new records',
  required: false,
  defaultValue: 5,
});

export const maxRecordsProp = Property.Number({
  displayName: 'Maximum Records',
  description: 'Maximum number of records to return',
  required: false,
  defaultValue: 100,
});