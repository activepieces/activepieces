import { Property, createAction } from '@activepieces/pieces-framework';
import { TeableAuth } from '../auth';
import { TeableCommon } from '../common';
import { teableClient } from '../common/client';
import { TeableCreatableFieldTypes } from '../common/constants';
import { teableOutputSchemas } from '../output-schemas';

export const createFieldAction = createAction({
  auth: TeableAuth,
  name: 'teable_create_field',
  classification: 'WRITE',
  displayName: 'Create Field',
  description: 'Adds a new field (column) to a table.',
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
      description: 'The name of the new field. Must be unique within the table.',
      required: true,
    }),
    type: Property.StaticDropdown({
      displayName: 'Type',
      required: true,
      options: {
        options: TeableCreatableFieldTypes.map((type) => ({ label: type, value: type })),
      },
    }),
    description: Property.LongText({
      displayName: 'Description',
      required: false,
    }),
    options: Property.Json({
      displayName: 'Options',
      description:
        'Type-specific options as JSON. See the Teable field documentation.',
      required: false,
    }),
  },
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
