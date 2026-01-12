import {
  PiecePropValueSchema,
  Property,
  createAction,
  DynamicPropsValue,
} from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { drupalAuth } from '../../';
import { drupal } from '../common/jsonapi';
import { 
  fetchEntityTypesForEditing,
  buildFieldProperties
} from '../common/drupal-entities';

type DrupalAuthType = PiecePropValueSchema<typeof drupalAuth>;

export const drupalCreateEntityAction = createAction({
  auth: drupalAuth,
  name: 'drupal-create-entity',
  displayName: 'Create Entity',
  description: 'Create a new entity in Drupal with smart field discovery and validation',
  props: {
    entity_type: Property.Dropdown({
      auth: drupalAuth,
      displayName: 'Entity Type',
      description: 'Choose the type of content to create.',
      required: true,
      refreshers: [],
      options: async ({ auth }) => fetchEntityTypesForEditing(auth),
    }),
    entity_fields: Property.DynamicProperties({
      auth: drupalAuth,
      displayName: 'Entity Fields',
      description: 'Fill in the content fields. Available fields depend on the entity type selected above.',
      required: false,
      refreshers: ['entity_type'],
      props: async (propsValue) => {
 
        const { auth, entity_type } = propsValue;
        if (!auth) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Please configure authentication first',
          };
        }
        return buildFieldProperties(auth, entity_type, true);
      }
    }),
  },
  async run({ auth, propsValue }) {
    const entityInfo = propsValue['entity_type'] as any;
    const fieldsData = propsValue['entity_fields'] as any;
    
    // Extract field values, handling text fields with format correctly
    const fieldsToCreate: Record<string, any> = {};
    const processedFormatFields = new Set<string>();
    
    for (const [key, value] of Object.entries(fieldsData)) {
      // Skip empty values and already processed format fields
      if (value === undefined || value === null || value === '' || processedFormatFields.has(key)) {
        continue;
      }
      
      // Handle format fields (they should be combined with their text field)
      if (key.endsWith('_format')) {
        const textFieldName = key.replace('_format', '');
        const textValue = fieldsData[textFieldName];
        
        if (textValue) {
          fieldsToCreate[textFieldName] = {
            value: textValue,
            format: value
          };
          processedFormatFields.add(textFieldName);
        }
        processedFormatFields.add(key);
      }
      // Handle text fields (check if they have a format)
      else {
        const formatKey = `${key}_format`;
        const formatValue = fieldsData[formatKey];
        
        if (formatValue && formatValue !== 'undefined') {
          fieldsToCreate[key] = {
            value: value,
            format: formatValue
          };
          processedFormatFields.add(formatKey);
        } else {
          fieldsToCreate[key] = value;
        }
      }
    }
    
    if (Object.keys(fieldsToCreate).length === 0) {
      throw new Error('At least one field must be provided to create an entity');
    }
    
    return await drupal.createEntity(
      auth,
      entityInfo.entity_type,
      entityInfo.bundle,
      fieldsToCreate
    );
  },
});