import { createAction, Property } from '@activepieces/pieces-framework';
import { metabaseAiProps } from '../../ai-props';
import { metabaseApi } from '../../api';
import { metabaseAuth } from '../../auth';
import { metabaseUpdateFieldOutputSchema } from '../../output-schemas';

export const updateFieldAction = createAction({
  auth: metabaseAuth,
  name: 'metabase_update_field',
  outputSchema: metabaseUpdateFieldOutputSchema,
  displayName: 'Update Field',
  description: "Update a field's data-model settings.",
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      "Changes only the fields you set on a column's data-model settings: display name, description, semantic type, visibility, foreign-key target, filter-values behaviour. Needs an admin key.",
    idempotent: true,
  },
  props: {
    fieldId: metabaseAiProps.fieldId({ required: true }),
    displayName: Property.ShortText({
      displayName: 'Display Name',
      description: 'New display name. Empty = unchanged.',
      required: false,
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'New description. Empty = unchanged.',
      required: false,
    }),
    semanticType: Property.ShortText({
      displayName: 'Semantic Type',
      description:
        'e.g. type/Category, type/Email, type/FK, type/PK, type/Currency. Empty = unchanged.',
      required: false,
    }),
    visibilityType: Property.StaticDropdown({
      displayName: 'Visibility',
      description: 'Where the field shows. Empty = unchanged.',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'Everywhere', value: 'normal' },
          { label: 'Only in detail views', value: 'details-only' },
          { label: 'Do not include', value: 'sensitive' },
          { label: 'Hidden', value: 'hidden' },
          { label: 'Retired', value: 'retired' },
        ],
      },
    }),
    fkTargetFieldId: Property.Number({
      displayName: 'Foreign Key Target Field ID',
      description:
        'With semantic type type/FK: the field this column points to. Empty = unchanged.',
      required: false,
    }),
    hasFieldValues: Property.StaticDropdown({
      displayName: 'Filter Values',
      description: 'How filters on this field offer values. Empty = unchanged.',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'A list of all values', value: 'list' },
          { label: 'Search box', value: 'search' },
          { label: 'Plain input box', value: 'none' },
          { label: 'Automatic', value: 'auto-list' },
        ],
      },
    }),
    settings: Property.Json({
      displayName: 'Settings',
      description:
        'Formatting settings object, e.g. {"currency": "EUR"}. Replaces the existing settings. Empty = unchanged.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    return await metabaseApi.updateField({
      auth,
      fieldId: propsValue.fieldId,
      body: {
        display_name: propsValue.displayName,
        description: propsValue.description,
        semantic_type: propsValue.semanticType,
        visibility_type: propsValue.visibilityType,
        fk_target_field_id: propsValue.fkTargetFieldId,
        has_field_values: propsValue.hasFieldValues,
        settings: propsValue.settings,
      },
    });
  },
});
