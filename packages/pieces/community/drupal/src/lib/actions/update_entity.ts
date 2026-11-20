import {
  MarkdownVariant,
  Property,
  createAction,
} from '@activepieces/pieces-framework';
import { drupalAuth } from '../auth';
import { drupal } from '../common/jsonapi';
import {
  fetchEntityTypesForEditing,
  buildFieldProperties
} from '../common/drupal-entities';


export const drupalUpdateEntityAction = createAction({
  auth: drupalAuth,
  name: 'drupal-update-entity',
  classification: 'WRITE',
  displayName: 'Update Entity',
  description: 'Change fields on an existing Drupal entity.',
  audience: 'both',
  aiMetadata: { description: 'Updates an existing Drupal entity identified by its entity type, bundle, and UUID via a JSON:API PATCH, changing only the fields you provide (empty fields are left untouched); at least one field value is required. Use to modify known content. Idempotent: re-applying the same field values to the same UUID yields the same end state.', idempotent: true },
  propertyGroups: [
    { key: 'item', display: 'section', label: 'Entity to Update', icon: 'tag', props: ['entity_type', 'entity_uuid'] },
    { key: 'changes', display: 'section', label: 'Changes', icon: 'sliders', props: ['changes_info', 'entity_fields'] },
  ],
  props: {
    entity_type: Property.Dropdown({
      auth: drupalAuth,
      displayName: 'Entity Type',
      description: 'The kind of entity, shown as bundle (entity type).',
      required: true,
      refreshers: [],
      options: async ({ auth }) => fetchEntityTypesForEditing(auth),
    }),
    entity_uuid: Property.ShortText({
      displayName: 'Entity UUID',
      description: 'Find it in the entity\'s JSON:API URL or a List Entities result.',
      placeholder: '3f1c9a52-7b0e-4c1d-9a8e-2f6b1d4c5e7a',
      required: true,
    }),
    changes_info: Property.MarkDown({
      value: 'Empty fields keep their value; switches are always sent, on or off.',
      variant: MarkdownVariant.INFO,
    }),
    entity_fields: Property.DynamicProperties({
      auth: drupalAuth,
      displayName: 'Fields',
      description: 'Fields of the selected type, in your site\'s form order.',
      required: false,
      refreshers: ['entity_type'],
      props: async (propsValue) => {
        const { auth, entity_type } = propsValue;
        if (!auth) {
          return {};
        }
        return buildFieldProperties(auth, entity_type, false);
      }
    }),
  },
  async run({ auth, propsValue }) {
    const entityInfo = propsValue['entity_type'] as any;

    const fieldsData = propsValue['entity_fields'] as any;

    // Extract field values, handling text fields with format correctly
    const fieldsToUpdate: Record<string, any> = {};
    const processedFormatFields = new Set<string>();

    for (const [key, value] of Object.entries(fieldsData ?? {})) {
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
      throw new Error('Fill in at least one field to update.');
    }

    return await drupal.updateEntity(
      auth,
      entityInfo.entity_type,
      entityInfo.bundle,
      propsValue['entity_uuid'],
      fieldsToUpdate
    );
  },
});