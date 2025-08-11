import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { fireberryAuth } from '../../index';
import { objectTypeDropdown } from '../common/props';
import { FireberryClient } from '../common/client';

const recordDropdown = Property.Dropdown({
  displayName: 'Record',
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
        resourceUri: `/api/record/${objectTypeStr}?$top=50`,
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
        options: options.slice(0, 50),
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

const updateFields = Property.DynamicProperties({
  displayName: 'Fields to Update',
  refreshers: ['objectType'],
  required: true,
  props: async ({ auth, objectType }) => {
    if (!auth || !objectType) return {};
    
    const authStr = typeof auth === 'string' ? auth : (auth as { value: string })?.value;
    const objectTypeStr = typeof objectType === 'string' ? objectType : (objectType as { value: string })?.value;
    const client = new FireberryClient(authStr);
    
    try {
      const metadata = await client.getObjectFieldsMetadata(objectTypeStr);
      const props: Record<string, any> = {};
      
      const fieldTypeMap: Record<string, string> = {
        'a1e7ed6f-5083-477b-b44c-9943a6181359': 'text',
        'ce972d02-5013-46d4-9d1d-f09df1ac346a': 'datetime',
        '6a34bfe3-fece-4da1-9136-a7b1e5ae3319': 'number',
        'a8fcdf65-91bc-46fd-82f6-1234758345a1': 'lookup',
        'b4919f2e-2996-48e4-a03c-ba39fb64386c': 'picklist',
        '80108f9d-1e75-40fa-9fa9-02be4ddc1da1': 'longtext',
      };
      
      const picklistCache: Record<string, any> = {};
      const picklistFields = metadata.data.filter(field => 
        fieldTypeMap[field.systemFieldTypeId] === 'picklist'
      );
      
      for (const field of picklistFields) {
        const largeLists = ['objecttypecode', 'resultcode'];
        if (!largeLists.includes(field.fieldName.toLowerCase())) {
          try {
            const picklistData = await client.getPicklistValues(objectTypeStr, field.fieldName);
            if (picklistData.data?.values && Array.isArray(picklistData.data.values)) {
              picklistCache[field.fieldName] = picklistData.data.values;
            }
          } catch (error) {
            picklistCache[field.fieldName] = [];
          }
        }
      }
      
      for (const field of metadata.data) {
        const systemFields = ['createdby', 'modifiedby', 'deletedby', 'createdon', 'modifiedon', 'deletedon'];
        if (field.fieldName.endsWith('id') && !field.label) {
          continue;
        }
        if (systemFields.includes(field.fieldName.toLowerCase())) {
          continue;
        }
        
        const fieldType = fieldTypeMap[field.systemFieldTypeId] || 'text';
        const isRequired = false;
        
        switch (fieldType) {
          case 'text':
            props[field.fieldName] = Property.ShortText({
              displayName: field.label || field.fieldName,
              required: isRequired,
              description: 'Leave empty to keep current value',
            });
            break;
          case 'number':
            props[field.fieldName] = Property.Number({
              displayName: field.label || field.fieldName,
              required: isRequired,
              description: 'Leave empty to keep current value',
            });
            break;
          case 'datetime':
            props[field.fieldName] = Property.DateTime({
              displayName: field.label || field.fieldName,
              required: isRequired,
              description: 'Leave empty to keep current value',
            });
            break;
          case 'picklist': {
            const largeLists = ['objecttypecode', 'resultcode'];
            if (largeLists.includes(field.fieldName.toLowerCase())) {
              props[field.fieldName] = Property.ShortText({
                displayName: field.label || field.fieldName,
                required: isRequired,
                description: 'Enter numeric value (leave empty to keep current)',
              });
            } else {
              const values = picklistCache[field.fieldName] || [];
              if (values.length > 0 && values.length <= 20) {
                const options = values.map((option: any) => ({
                  label: option.name || option.value,
                  value: option.value,
                }));
                
                props[field.fieldName] = Property.StaticDropdown({
                  displayName: field.label || field.fieldName,
                  required: isRequired,
                  options: {
                    disabled: false,
                    options: [
                      { label: '-- Keep Current Value --', value: '' },
                      ...options
                    ],
                  },
                });
              } else {
                props[field.fieldName] = Property.ShortText({
                  displayName: field.label || field.fieldName,
                  required: isRequired,
                  description: values.length > 20 
                    ? `Enter numeric value (${values.length} options available, leave empty to keep current)`
                    : 'Enter value (leave empty to keep current)',
                });
              }
            }
            break;
          }
          case 'longtext': {
            props[field.fieldName] = Property.LongText({
              displayName: field.label || field.fieldName,
              required: isRequired,
              description: 'Leave empty to keep current value',
            });
            break;
          }
          case 'lookup': {
            let description = 'Record ID (leave empty to keep current)';
            if (field.fieldName.includes('account')) description = 'Account record ID (leave empty to keep current)';
            else if (field.fieldName.includes('contact')) description = 'Contact record ID (leave empty to keep current)';
            else if (field.fieldName.includes('owner')) description = 'User record ID for owner (leave empty to keep current)';
            else if (field.fieldName.includes('product')) description = 'Product record ID (leave empty to keep current)';
            else if (field.fieldName.includes('user')) description = 'User record ID (leave empty to keep current)';
            
            props[field.fieldName] = Property.ShortText({
              displayName: field.label || field.fieldName,
              required: isRequired,
              description,
            });
            break;
          }
          default: {
            props[field.fieldName] = Property.ShortText({
              displayName: field.label || field.fieldName,
              required: isRequired,
              description: 'Leave empty to keep current value',
            });
            break;
          }
        }
      }
      
      return props;
    } catch (error) {
      console.error('Error fetching update fields:', error);
      return {};
    }
  },
});

export const updateRecordAction = createAction({
  name: 'update_record',
  displayName: 'Update Record',
  description: 'Update an existing record in Fireberry.',
  auth: fireberryAuth,
  props: {
    objectType: objectTypeDropdown,
    recordId: recordDropdown,
    fields: updateFields,
  },
  async run({ auth, propsValue }) {
    const client = new FireberryClient(auth as string);
    const { objectType, recordId, fields } = propsValue;
    
    if (!recordId) {
      throw new Error('Record ID is required');
    }
    
    const fieldsObj = typeof fields === 'string' ? JSON.parse(fields) : fields;
    
    if (typeof fieldsObj !== 'object' || fieldsObj === null) {
      throw new Error('Fields must be an object');
    }
    
    const updateData: Record<string, any> = {};
    for (const [key, value] of Object.entries(fieldsObj)) {
      if (value !== '' && value !== null && value !== undefined) {
        updateData[key] = value;
      }
    }
    
    const recordToUpdate = { id: recordId, record: updateData };
    
    return await client.batchUpdate(objectType, [recordToUpdate]);
  },
}); 