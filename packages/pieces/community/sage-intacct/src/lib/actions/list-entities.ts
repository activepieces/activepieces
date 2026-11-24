import { createAction } from '@activepieces/pieces-framework';
import { sageIntacctAuth } from '../auth';
import { sageIntacctClient } from '../common/client';

export const listEntitiesAction = createAction({
  auth: sageIntacctAuth,
  name: 'list_entities',
  displayName: 'List Entities',
  description: 'List the entities of a multi-entity Sage Intacct company.',
  classification: 'READ',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists the entities (locations set up as entities) of the connected Sage Intacct company, up to 1000, with key, id, name and status. Use it to discover entity IDs. A single-entity company returns an empty list. Read-only.',
    idempotent: true,
  },
  props: {},
  outputSchema: {
    fields: [
      { key: 'count', label: 'Count', format: 'number' },
      { key: 'truncated', label: 'Truncated', format: 'boolean' },
      {
        key: 'items',
        label: 'Items',
        labelKey: 'name',
        listItems: [
          { key: 'key', label: 'Key' },
          { key: 'id', label: 'Entity ID' },
          { key: 'name', label: 'Name' },
          { key: 'status', label: 'Status' },
        ],
      },
    ],
  },
  async run(context) {
    const { records, truncated } = await sageIntacctClient.queryAll({
      auth: context.auth,
      object: 'company-config/entity',
      fields: ['key', 'id', 'name', 'status'],
      orderBy: [{ id: 'asc' }],
      limit: 1000,
    });
    const items = records.map((record) => ({
      key: sageIntacctClient.readString({ record, path: 'key' }),
      id: sageIntacctClient.readString({ record, path: 'id' }),
      name: sageIntacctClient.readString({ record, path: 'name' }),
      status: sageIntacctClient.readString({ record, path: 'status' }),
    }));
    return { count: items.length, truncated, items };
  },
});
