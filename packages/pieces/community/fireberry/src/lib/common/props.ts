import { Property } from '@activepieces/pieces-framework';
import { FireberryClient } from './client';

export const objectTypeDropdown = Property.Dropdown({
  displayName: 'Object Type',
  required: true,
  refreshers: [],
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Connect your Fireberry account',
      };
    }
    const authStr = typeof auth === 'string' ? auth : (auth as { value: string })?.value;
    const client = new FireberryClient(authStr);
    const metadata = await client.getObjectsMetadata();
    const options = metadata.data.map(obj => ({
      label: obj.name,
      value: obj.systemName,
    }));
    return {
      disabled: false,
      options,
    };
  },
});

export const objectFields = Property.DynamicProperties({
  displayName: 'Fields',
  refreshers: ['objectType'],
  required: true,
  props: async ({ auth, objectType }) => {
    if (!auth || !objectType) return {};
    const objectTypeStr = typeof objectType === 'string' ? objectType : (objectType as { value: string })?.value;
    const authStr = typeof auth === 'string' ? auth : (auth as { value: string })?.value;
    const client = new FireberryClient(authStr);
    const metadata = await client.getObjectFieldsMetadata(objectTypeStr);
    const props: Record<string, any> = {};
    
    // Map Fireberry field type IDs to field types
    const fieldTypeMap: Record<string, string> = {
      'a1e7ed6f-5083-477b-b44c-9943a6181359': 'text',      // Text fields
      'ce972d02-5013-46d4-9d1d-f09df1ac346a': 'datetime',   // Date/DateTime fields  
      '6a34bfe3-fece-4da1-9136-a7b1e5ae3319': 'number',     // Number fields
      'a8fcdf65-91bc-46fd-82f6-1234758345a1': 'lookup',     // Lookup/Object fields
      'b4919f2e-2996-48e4-a03c-ba39fb64386c': 'picklist',   // Picklist fields
      '80108f9d-1e75-40fa-9fa9-02be4ddc1da1': 'longtext',   // Long text/Description fields
    };
    
    // Pre-fetch all picklist data to avoid async issues in property creation
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
          // Cache empty array for failed requests
          picklistCache[field.fieldName] = [];
        }
      }
    }
    
    // Now create properties synchronously using cached data
    for (const field of metadata.data) {
      // Skip system fields that users shouldn't edit
      const systemFields = ['createdby', 'modifiedby', 'deletedby', 'createdon', 'modifiedon', 'deletedon'];
      if (field.fieldName.endsWith('id') && !field.label) {
        continue; // Skip unnamed ID fields
      }
      if (systemFields.includes(field.fieldName.toLowerCase())) {
        continue; // Skip system-managed fields
      }
      
      const fieldType = fieldTypeMap[field.systemFieldTypeId] || 'text';
      const isRequired = false; // Fireberry doesn't provide required info in this endpoint
      
      switch (fieldType) {
        case 'text':
          props[field.fieldName] = Property.ShortText({
            displayName: field.label || field.fieldName,
            required: isRequired,
          });
          break;
        case 'number':
          props[field.fieldName] = Property.Number({
            displayName: field.label || field.fieldName,
            required: isRequired,
          });
          break;
        case 'datetime':
          props[field.fieldName] = Property.DateTime({
            displayName: field.label || field.fieldName,
            required: isRequired,
            description: 'Date and time in UTC format',
          });
          break;
        case 'picklist':
          const largeLists = ['objecttypecode', 'resultcode'];
          if (largeLists.includes(field.fieldName.toLowerCase())) {
            props[field.fieldName] = Property.ShortText({
              displayName: field.label || field.fieldName,
              required: isRequired,
              description: 'Enter the numeric value for this field',
            });
          } else {
            const values = picklistCache[field.fieldName] || [];
            if (values.length > 0 && values.length <= 20) {
              // Create StaticDropdown for manageable picklists
              const options = values.map((option: any) => ({
                label: option.name || option.value,
                value: option.value,
              }));
              
              props[field.fieldName] = Property.StaticDropdown({
                displayName: field.label || field.fieldName,
                required: isRequired,
                options: {
                  disabled: false,
                  options,
                },
              });
            } else {
              // Fallback to text input for large lists or failed requests
              props[field.fieldName] = Property.ShortText({
                displayName: field.label || field.fieldName,
                required: isRequired,
                description: values.length > 20 
                  ? `Enter numeric value (${values.length} options available)`
                  : 'Enter the value for this field',
              });
            }
          }
          break;
        case 'longtext':
          props[field.fieldName] = Property.LongText({
            displayName: field.label || field.fieldName,
            required: isRequired,
            description: 'Long text content',
          });
          break;
        case 'lookup':
          // Create more specific descriptions for common lookup fields
          let description = 'Record ID (GUID)';
          if (field.fieldName.includes('account')) description = 'Account record ID';
          else if (field.fieldName.includes('contact')) description = 'Contact record ID';
          else if (field.fieldName.includes('owner')) description = 'User record ID for owner';
          else if (field.fieldName.includes('product')) description = 'Product record ID';
          else if (field.fieldName.includes('user')) description = 'User record ID';
          
          props[field.fieldName] = Property.ShortText({
            displayName: field.label || field.fieldName,
            required: isRequired,
            description,
          });
          break;
        default:
          props[field.fieldName] = Property.ShortText({
            displayName: field.label || field.fieldName,
            required: isRequired,
            description: `${fieldType} field`,
          });
      }
    }
    return props;
  },
}); 