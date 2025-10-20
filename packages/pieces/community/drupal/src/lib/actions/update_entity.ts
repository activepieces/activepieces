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

export const drupalUpdateEntityAction = createAction({
  auth: drupalAuth,
  name: 'drupal-update-entity',
  displayName: 'Update Entity',
  description: 'Update an existing entity in Drupal with smart field discovery and validation',
  props: {
    entity_type: Property.Dropdown({
      displayName: 'Entity Type',
      description: 'Select the entity type and bundle',
      required: true,
      refreshers: [],
      options: async ({ auth }) => fetchEntityTypesForEditing(auth as DrupalAuthType),
    }),
    entity_uuid: Property.ShortText({
      displayName: 'Entity UUID',
      description: 'The UUID of the entity to update',
      required: true,
    }),
    entity_fields: Property.DynamicProperties({
      displayName: 'Entity Fields',
      description: 'Update the values for the entity fields (only provide values for fields you want to change)',
      required: false,
      refreshers: ['entity_type'],
      props: async (propsValue) => {
        const { auth, entity_type } = propsValue;
        return buildFieldProperties(auth as DrupalAuthType, entity_type, false);
      }
    }),
  },
  async run({ auth, propsValue }) {
    const entityInfo = propsValue['entity_type'] as any;
    
    const fieldsData = propsValue['entity_fields'] as any;
    
    // Extract field values, handling text fields with format correctly
    const fieldsToUpdate: Record<string, any> = {};
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
          fieldsToUpdate[textFieldName] = {
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
        
        if (formatValue && formatValue !== undefined && formatValue !== null && formatValue !== '') {
          fieldsToUpdate[key] = {
            value: value,
            format: formatValue
          };
          processedFormatFields.add(formatKey);
        } else {
          fieldsToUpdate[key] = value;
        }
      }
    }
    
    if (Object.keys(fieldsToUpdate).length === 0) {
      throw new Error('No fields provided to update');
    }
    
    return await drupal.updateEntity(
      auth as DrupalAuthType,
      entityInfo.entity_type,
      entityInfo.bundle,
      propsValue['entity_uuid'],
      fieldsToUpdate
    );
  },
});