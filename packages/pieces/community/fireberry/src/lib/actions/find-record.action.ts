import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { fireberryAuth } from '../../index';
import { objectTypeDropdown } from '../common/props';
import { FireberryClient } from '../common/client';

const fieldsToReturn = Property.DynamicProperties({
  displayName: 'Fields to Return',
  refreshers: ['objectType'],
  required: false,
  props: async ({ auth, objectType }) => {
    if (!auth || !objectType) return {};
    
    const authStr = typeof auth === 'string' ? auth : (auth as { value: string })?.value;
    const objectTypeStr = typeof objectType === 'string' ? objectType : (objectType as { value: string })?.value;
    const client = new FireberryClient(authStr);
    
    try {
      const metadata = await client.getObjectFieldsMetadata(objectTypeStr);
      const props: Record<string, any> = {};
      
      for (const field of metadata.data) {
        const systemFields = ['createdby', 'modifiedby', 'deletedby'];
        if (field.fieldName.endsWith('id') && !field.label) {
          continue;
        }
        if (systemFields.includes(field.fieldName.toLowerCase())) {
          continue;
        }
        
        props[field.fieldName] = Property.Checkbox({
          displayName: field.label || field.fieldName,
          required: false,
          description: `Include ${field.label || field.fieldName} in search results`,
        });
      }
      
      return props;
    } catch (error) {
      console.error('Error fetching fields for selection:', error);
      return {};
    }
  },
});

export const findRecordAction = createAction({
  name: 'find_record',
  displayName: 'Find Records',
  description: 'Search for records in Fireberry.',
  auth: fireberryAuth,
  props: {
    objectType: objectTypeDropdown,
    searchQuery: Property.LongText({
      displayName: 'Search Query',
      required: false,
      description: 'Enter search criteria (e.g., "accountname=John" or "email contains @example.com"). Leave empty to get all records.',
    }),
    fieldsToReturn: fieldsToReturn,
    sortBy: Property.ShortText({
      displayName: 'Sort By Field',
      required: false,
      description: 'System name of field to sort by (e.g., "createdon", "accountname")',
    }),
    sortOrder: Property.StaticDropdown({
      displayName: 'Sort Order',
      required: false,
      defaultValue: 'desc',
      options: {
        disabled: false,
        options: [
          { label: 'Descending (newest first)', value: 'desc' },
          { label: 'Ascending (oldest first)', value: 'asc' },
        ],
      },
    }),
    pageSize: Property.Number({
      displayName: 'Page Size',
      required: false,
      defaultValue: 25,
      description: 'Number of records to return (max 50)',
    }),
    pageNumber: Property.Number({
      displayName: 'Page Number',
      required: false,
      defaultValue: 1,
      description: 'Page number to retrieve (max 10)',
    }),
  },
  async run({ auth, propsValue }) {
    const client = new FireberryClient(auth as string);
    const { objectType, searchQuery, fieldsToReturn, sortBy, sortOrder, pageSize, pageNumber } = propsValue;
    
    const selectedFields: string[] = [];
    if (fieldsToReturn && typeof fieldsToReturn === 'object') {
      for (const [fieldName, isSelected] of Object.entries(fieldsToReturn)) {
        if (isSelected === true) {
          selectedFields.push(fieldName);
        }
      }
    }
    
    const objectsMetadata = await client.getObjectsMetadata();
    const targetObject = objectsMetadata.data.find(obj => obj.systemName === objectType);
    
    if (!targetObject) {
      throw new Error(`Object type '${objectType}' not found`);
    }
    
    const queryBody: Record<string, any> = {
      objecttype: parseInt(targetObject.objectType),
    };
    
    if (selectedFields.length > 0) {
      queryBody['fields'] = selectedFields.join(',');
    }
    
    if (searchQuery && searchQuery.trim()) {
      queryBody['query'] = searchQuery.trim();
    }
    
    if (sortBy && sortBy.trim()) {
      queryBody['sort_by'] = sortBy.trim();
      queryBody['sort_type'] = sortOrder || 'desc';
    }
    
    if (pageSize) {
      queryBody['page_size'] = Math.min(Math.max(1, pageSize), 50);
    }
    if (pageNumber) {
      queryBody['page_number'] = Math.min(Math.max(1, pageNumber), 10);
    }
    
    const response = await client.request<{
      success: boolean;
      data: {
        ObjectName: string;
        SystemName: string;
        ObjectType: number;
        PrimaryKey: string;
        PrimaryField: string;
        PageNum: number;
        SortBy: string;
        SortBy_Desc: boolean;
        IsLastPage: boolean;
        Columns: Array<Record<string, any>>;
        Data: Array<Record<string, any>>;
      };
    }>({
      method: HttpMethod.POST,
      resourceUri: '/api/query',
      body: queryBody,
    });
    
    if (!response.success) {
      throw new Error('Query failed');
    }
    
    return {
      success: true,
      query: queryBody,
      results: {
        objectName: response.data.ObjectName,
        systemName: response.data.SystemName,
        objectType: response.data.ObjectType,
        pageNumber: response.data.PageNum,
        sortBy: response.data.SortBy,
        sortDescending: response.data.SortBy_Desc,
        isLastPage: response.data.IsLastPage,
        primaryKey: response.data.PrimaryKey,
        primaryField: response.data.PrimaryField,
        columns: response.data.Columns,
        records: response.data.Data,
        recordCount: response.data.Data.length,
      },
    };
  },
}); 