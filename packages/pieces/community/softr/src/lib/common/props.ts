import { Property } from '@activepieces/pieces-framework';
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
