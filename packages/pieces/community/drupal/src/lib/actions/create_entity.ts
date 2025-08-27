import {
  PiecePropValueSchema,
  Property,
  createAction,
} from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { drupalAuth } from '../../';
import { 
  fetchEntityTypes, 
  makeEntityRequest, 
  DrupalEntityType, 
  DrupalEntityTypeFields, 
  DrupalEntityTypeFieldTypeSelectOptions 
} from '../common/entity-utils';

type DrupalAuthType = PiecePropValueSchema<typeof drupalAuth>;

export const drupalCreateEntityAction = createAction({
  auth: drupalAuth,
  name: 'drupal-create-entity',
  displayName: 'Create Entity',
  description: 'Create a new entity (content, user, taxonomy term, etc.) on the Drupal site',
  props: {
    entity_type: Property.Dropdown({
      displayName: 'Entity Type',
      description: 'The entity type and bundle to create.',
      required: true,
      refreshers: [],
      options: async ({ auth }) => {
        return await fetchEntityTypes(auth as DrupalAuthType);
      },
    }),
    fields: Property.DynamicProperties({
      displayName: 'Fields',
      refreshers: ['entity_type'],
      required: true,
      props: async ({ entity_type }) => {
        console.debug('Entity type field input', entity_type);
        const fields: Record<string, any> = {};
        const items = entity_type['fields'] as DrupalEntityTypeFields[];
        items.forEach((field: any) => {
          if (field.type === 'boolean') {
            fields[field.key] = Property.Checkbox({
              displayName: field.label,
              description: field.description,
              required: field.required,
              defaultValue: field.default_value,
            });
          } else if (field.type === 'created') {
            fields[field.key] = Property.DateTime({
              displayName: field.label,
              description: field.description,
              required: field.required,
              defaultValue: field.default_value,
            });
          } else if (field.type === 'text' || field.type === 'text_long' || field.type === 'text_with_summary') {
            fields[field.key] = Property.LongText({
              displayName: field.label,
              description: field.description,
              required: field.required,
              defaultValue: field.default_value,
            });
          } else if (field.type === 'select') {
            fields[field.key] = Property.StaticDropdown({
              displayName: field.label,
              description: field.description,
              required: field.required,
              defaultValue: field.default_value,
              options: {
                options: field.options.map((option: DrupalEntityTypeFieldTypeSelectOptions) => ({
                  label: option.name,
                  value: option.key,
                }))},
            });
          } else if (field.type === 'comment') {
            // Ignore this field.
          } else {
            fields[field.key] = Property.ShortText({
              displayName: field.label,
              description: field.description,
              required: field.required,
              defaultValue: field.default_value,
            });
          }
        });
        console.debug('Fields for this entity type', fields);
        return fields;
      },
    }),
  },
  async run({ auth, propsValue }) {
    const requestBody = {
      entity_type: propsValue.entity_type.id,
      fields: propsValue.fields,
    };

    console.debug('Entity create request', requestBody);
    
    const result = await makeEntityRequest<DrupalEntityType>(
      auth as DrupalAuthType,
      `/modeler_api/entity/create`,
      HttpMethod.POST,
      requestBody
    );
    
    console.debug('Entity create call completed', result);

    if (result.status === 200 || result.status === 202) {
      return result.body;
    } else {
      throw new Error(`Failed to create entity: ${result.status} - ${JSON.stringify(result.body)}`);
    }
  },
});