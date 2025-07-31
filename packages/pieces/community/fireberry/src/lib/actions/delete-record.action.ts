import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { fireberryAuth } from '../../index';
import { objectTypeDropdown } from '../common/props';
import { FireberryClient } from '../common/client';

const recordsToDeleteDropdown = Property.MultiSelectDropdown({
  displayName: 'Records to Delete',
  required: true,
  refreshers: ['objectType'],
  options: async ({ auth, objectType }) => {
    if (!auth || !objectType) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Select object type first',
      };
    }

    try {
      const authStr = typeof auth === 'string' ? auth : (auth as { value: string })?.value;
      const objectTypeStr = typeof objectType === 'string' ? objectType : (objectType as { value: string })?.value;
      const client = new FireberryClient(authStr);
      
      const response = await client.request<{ 
        success: boolean; 
        data: { 
          Records: Array<Record<string, any>>;
          PrimaryField: string;
          PrimaryKey: string;
          Total_Records: number;
        } 
      }>({
        method: HttpMethod.GET,
        resourceUri: `/api/record/${objectTypeStr}?$top=100`,
      });
      
      if (!response.data?.Records || !Array.isArray(response.data.Records)) {
        return {
          disabled: false,
          options: [],
          placeholder: response.data?.Total_Records === 0 ? 'No records found' : 'Error loading records',
        };
      }
      
      const primaryField = response.data.PrimaryField;
      const primaryKey = response.data.PrimaryKey;
      
      const options = response.data.Records.map((record: any) => {
        const displayName = record[primaryField] || 
                           record.name || record.title || record.subject || 
                           record.firstname || record.lastname || record.email ||
                           record.accountname || record.contactname ||
                           `Record ${record[primaryKey]?.substring(0, 8) || 'Unknown'}`;
        
        return {
          label: displayName,
          value: record[primaryKey],
        };
      });
      
      return {
        disabled: false,
        options: options.slice(0, 100),
      };
    } catch (error) {
      return {
        disabled: false,
        options: [],
        placeholder: 'Error loading records',
      };
    }
  },
});

export const deleteRecordAction = createAction({
  name: 'delete_record',
  displayName: 'Delete Records',
  description: 'Delete records from Fireberry.',
  auth: fireberryAuth,
  props: {
    objectType: objectTypeDropdown,
    recordIds: recordsToDeleteDropdown,
    confirmDeletion: Property.Checkbox({
      displayName: 'Confirm Deletion',
      required: true,
      description: 'Check this box to confirm you want to permanently delete the selected records. This action cannot be undone.',
    }),
  },
  async run({ auth, propsValue }) {
    const client = new FireberryClient(auth as string);
    const { objectType, recordIds, confirmDeletion } = propsValue;
    
    if (!confirmDeletion) {
      throw new Error('You must confirm deletion by checking the confirmation box');
    }
    
    if (!recordIds || !Array.isArray(recordIds) || recordIds.length === 0) {
      throw new Error('At least one record must be selected for deletion');
    }
    
    if (recordIds.length > 20) {
      throw new Error('Maximum 20 records can be deleted at once');
    }
    
    const result = await client.batchDelete(objectType, recordIds);
    
    return {
      success: true,
      deletedCount: recordIds.length,
      recordIds: recordIds,
      message: `Successfully deleted ${recordIds.length} record(s)`,
      apiResponse: result,
    };
  },
}); 