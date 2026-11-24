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
    base_id: TeableCommon.base_id_full,
    name: Property.ShortText({
      displayName: 'Name',
      description: 'The name of the new table.',
      placeholder: 'Projects',
      required: true,
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'Shown under the table name in Teable.',
      required: false,
    }),
  },
  propertyGroups: [
    {
      key: 'base',
      display: 'section',
      label: 'Base',
      icon: 'inbox',
      props: ['base_id'],
    },
    {
      key: 'table',
      display: 'section',
      label: 'New Table',
      icon: 'text',
      props: ['name', 'description'],
    },
  ],
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
