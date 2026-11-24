import { MarkdownVariant, Property, createAction } from '@activepieces/pieces-framework';
import { TeableAuth } from '../auth';
import { TeableCommon } from '../common';
import { teableClient } from '../common/client';
import { TeableCreatableFieldTypeOptions } from '../common/constants';
import { teableOutputSchemas } from '../output-schemas';

export const createFieldAction = createAction({
  auth: TeableAuth,
  name: 'teable_create_field',
  classification: 'WRITE',
  displayName: 'Create Field',
  description: 'Adds a new field to a table.',
  audience: 'both',
  aiMetadata: {
    description:
      'Adds a new column to a Teable table with the given name and type, and optional type-specific options such as select choices. Each call adds another column; duplicate names fail.',
    idempotent: false,
  },
  props: {
    base_id: TeableCommon.base_id,
    table_id: TeableCommon.table_id,
    name: Property.ShortText({
      displayName: 'Name',
      description: 'Must be unique in the table.',
      placeholder: 'Status',
      required: true,
      width: 'half',
    }),
    type: Property.StaticDropdown({
      displayName: 'Type',
      description: 'The kind of data the field holds.',
      required: true,
      width: 'half',
      options: {
        options: TeableCreatableFieldTypeOptions,
      },
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'Help text shown with the field in Teable.',
      required: false,
    }),
    options_help: Property.MarkDown({
      value:
        'Only some types need options, e.g. Single select `{"choices": [{"name": "Open"}]}` or Formula `{"expression": "1 + 1"}`.',
      variant: MarkdownVariant.INFO,
    }),
    options: Property.Json({
      displayName: 'Options',
      description: 'Settings for the chosen type, as JSON.',
      required: false,
    }),
  },
  propertyGroups: [
    {
      key: 'table',
      display: 'section',
      label: 'Table',
      icon: 'inbox',
      props: ['base_id', 'table_id'],
    },
    {
      key: 'field',
      display: 'section',
      label: 'Field',
      icon: 'tag',
      props: ['name', 'type', 'description'],
    },
    {
      key: 'settings',
      display: 'section',
      label: 'Options',
      icon: 'sliders',
      props: ['options_help', 'options'],
    },
  ],
  outputSchema: teableOutputSchemas.createField,
  async run(context) {
    const { table_id, name, type, description, options } = context.propsValue;
    const trimmed = name.trim();
    if (trimmed.length === 0) {
      throw new Error('Name must not be empty.');
    }
    const hasOptions =
      typeof options === 'object' && options !== null && Object.keys(options).length > 0;
    return teableClient.createField({
      auth: context.auth,
      tableId: table_id,
      body: {
        name: trimmed,
        type,
        ...(description !== undefined && description !== '' ? { description } : {}),
        ...(hasOptions ? { options } : {}),
      },
    });
  },
});
