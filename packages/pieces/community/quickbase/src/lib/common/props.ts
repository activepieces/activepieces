import { Property } from '@activepieces/pieces-framework';
import { QuickbaseClient } from './client';
import { QuickbaseApp, QuickbaseTable, QuickbaseField } from './types';


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

export const createDynamicFieldsMapperProp = () => Property.DynamicProperties({
  displayName: 'Field Values',
  description: 'Select and set values for table fields',
  required: true,
  refreshers: ['appId', 'tableId'],
  props: async ({ auth, appId, tableId }) => {
    if (!auth || !appId || !tableId) {
      return {};
    }

    try {
      const client = new QuickbaseClient(auth as unknown as string);
      const fields = await client.get<QuickbaseField[]>(`/fields?tableId=${tableId}`);
      
      const props: Record<string, any> = {};
      
      for (const field of fields) {
        if (field.id === 3) continue;
        
        const propKey = `field_${field.id}`;
        const isRequired = field.required || false;
        
        if (field.type === 'checkbox') {
          props[propKey] = Property.Checkbox({
            displayName: `${field.label}${isRequired ? ' *' : ''}`,
            description: `${field.type} field${isRequired ? ' (required)' : ''}`,
            required: isRequired,
          });
        } else if (field.type === 'number') {
          props[propKey] = Property.Number({
            displayName: `${field.label}${isRequired ? ' *' : ''}`,
            description: `${field.type} field${isRequired ? ' (required)' : ''}`,
            required: isRequired,
          });
        } else {
          props[propKey] = Property.ShortText({
            displayName: `${field.label}${isRequired ? ' *' : ''}`,
            description: `${field.type} field${isRequired ? ' (required)' : ''}`,
            required: isRequired,
          });
        }
      }
      
      return props;
    } catch (error) {
      return {};
    }
  },
});

export const filtersProp = Property.Object({
  displayName: 'Filters',
  description: 'Filter criteria to find records. Use field names or field IDs as keys.',
  required: false,
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


export const createAppIdProp = () => Property.Dropdown({
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

export const createTableIdProp = () => Property.Dropdown({
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

export const createMergeFieldProp = () => Property.Dropdown({
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


export const createSortFieldProp = () => Property.Dropdown({
  displayName: 'Sort Field',
  description: 'Field to sort records by (optional)',
  required: false,
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
        options: [
          { label: 'No sorting', value: '' },
          ...fields
            .filter(field => ['text', 'number', 'date', 'timestamp'].includes(field.type))
            .map(field => ({
              label: `${field.label} (${field.type})`,
              value: field.id.toString(),
            }))
        ],
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

export const createSortOrderProp = () => Property.StaticDropdown({
  displayName: 'Sort Order',
  description: 'Order to sort records',
  required: false,
  defaultValue: 'ASC',
  options: {
    options: [
      { label: 'Ascending (A-Z, 1-9)', value: 'ASC' },
      { label: 'Descending (Z-A, 9-1)', value: 'DESC' },
    ],
  },
});

export const createRecordIdProp = () => Property.Dropdown({
  displayName: 'Record',
  description: 'Select a record from the table',
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
      const displayField = fields.find(f => f.type === 'text' && f.label.toLowerCase().includes('name')) 
                         || fields.find(f => f.type === 'text')
                         || fields[1];


      const query = {
        from: tableId,
        select: [3, displayField?.id || 6],
        options: { top: 50 },
      };

      const response = await client.post<any>('/records/query', query);
      
      return {
        options: response.data.map((record: any) => {
          const recordId = record['3']?.value;
          const displayValue = record[displayField?.id.toString() || '6']?.value || `Record ${recordId}`;
          return {
            label: `${displayValue} (ID: ${recordId})`,
            value: recordId.toString(),
          };
        }),
      };
    } catch (error) {
      return {
        disabled: true,
        placeholder: 'Failed to load records',
        options: [],
      };
    }
  },
});


export const appIdProp = createAppIdProp();
export const tableIdProp = createTableIdProp();
export const mergeFieldProp = createMergeFieldProp();
export const sortFieldProp = createSortFieldProp();
export const sortOrderProp = createSortOrderProp();
export const recordIdDropdownProp = createRecordIdProp();
export const dynamicFieldsMapperProp = createDynamicFieldsMapperProp();