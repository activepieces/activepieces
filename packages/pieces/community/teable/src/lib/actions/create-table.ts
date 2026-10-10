import { Property, createAction } from '@activepieces/pieces-framework';
import { TeableAuth } from '../auth';
import { TeableCommon } from '../common';
import { teableClient } from '../common/client';
import { teableOutputSchemas } from '../output-schemas';

export const createTableAction = createAction({
  auth: TeableAuth,
  name: 'teable_create_table',
  classification: 'WRITE',
  displayName: 'Create Table',
  description: 'Creates a new table in a base.',
  audience: 'both',
  aiMetadata: {
    description:
      'Creates a new table in a Teable base with a default grid view and default fields, and returns the table with its field IDs. Each call creates another table, so a retry makes a duplicate.',
    idempotent: false,
  },
  props: {
    base_id: TeableCommon.base_id,
    name: Property.ShortText({
      displayName: 'Name',
      description: 'The name of the new table.',
      required: true,
    }),
    description: Property.LongText({
      displayName: 'Description',
      required: false,
    }),
  },
  outputSchema: teableOutputSchemas.createTable,
  async run(context) {
    const { base_id, name, description } = context.propsValue;
    const trimmed = name.trim();
    if (trimmed.length === 0) {
      throw new Error('Name must not be empty.');
    }
    return teableClient.createTable({
      auth: context.auth,
      baseId: base_id,
      body: {
        name: trimmed,
        ...(description !== undefined && description !== '' ? { description } : {}),
      },
    });
  },
});
