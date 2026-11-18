import { createAction, Property } from '@activepieces/pieces-framework';
import { metabaseAiProps } from '../../ai-props';
import { metabaseApi } from '../../api';
import { metabaseAuth } from '../../auth';
import { metabaseUpdateTableOutputSchema } from '../../output-schemas';

export const updateTableAction = createAction({
  auth: metabaseAuth,
  name: 'metabase_update_table',
  outputSchema: metabaseUpdateTableOutputSchema,
  displayName: 'Update Table',
  description: "Update a table's data-model settings.",
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      "Changes only the fields you set on a table's data-model settings: display name, description, visibility, caveats, field order. Needs an admin key.",
    idempotent: true,
  },
  props: {
    tableId: metabaseAiProps.tableId({ required: true }),
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
    visibilityType: Property.StaticDropdown({
      displayName: 'Visibility',
      description: 'Hide the table from users. Empty = unchanged.',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'Hidden', value: 'hidden' },
          { label: 'Technical', value: 'technical' },
          { label: 'Cruft', value: 'cruft' },
        ],
      },
    }),
    caveats: Property.LongText({
      displayName: 'Caveats',
      description:
        'Things users should know about this table. Empty = unchanged.',
      required: false,
    }),
    pointsOfInterest: Property.LongText({
      displayName: 'Points of Interest',
      description: 'What is useful about this table. Empty = unchanged.',
      required: false,
    }),
    fieldOrder: Property.StaticDropdown({
      displayName: 'Field Order',
      description: 'How columns are ordered. Empty = unchanged.',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'Database', value: 'database' },
          { label: 'Alphabetical', value: 'alphabetical' },
          { label: 'Smart', value: 'smart' },
          { label: 'Custom', value: 'custom' },
        ],
      },
    }),
  },
  async run({ auth, propsValue }) {
    return await metabaseApi.updateTable({
      auth,
      tableId: propsValue.tableId,
      body: {
        display_name: propsValue.displayName,
        description: propsValue.description,
        visibility_type: propsValue.visibilityType,
        caveats: propsValue.caveats,
        points_of_interest: propsValue.pointsOfInterest,
        field_order: propsValue.fieldOrder,
      },
    });
  },
});
