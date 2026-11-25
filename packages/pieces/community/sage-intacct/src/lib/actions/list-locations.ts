import { createAction } from '@activepieces/pieces-framework';
import { sageIntacctAuth } from '../auth';
import { sageIntacctClient } from '../common/client';

export const listLocationsAction = createAction({
  auth: sageIntacctAuth,
  name: 'list_locations',
  displayName: 'List Locations',
  description: 'List the locations of the Sage Intacct company.',
  classification: 'READ',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists the locations (sites) of the connected Sage Intacct company, up to 1000, with key, id and name. Use it to discover the location_id to put on invoice or bill lines when a GL account requires a location. Read-only.',
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
          { key: 'id', label: 'Location ID' },
          { key: 'name', label: 'Name' },
        ],
      },
    ],
  },
  async run(context) {
    const { records, truncated } = await sageIntacctClient.queryAll({
      auth: context.auth,
      object: 'company-config/location',
      fields: ['key', 'id', 'name'],
      orderBy: [{ id: 'asc' }],
      limit: 1000,
    });
    const items = records.map((record) => ({
      key: sageIntacctClient.readString({ record, path: 'key' }),
      id: sageIntacctClient.readString({ record, path: 'id' }),
      name: sageIntacctClient.readString({ record, path: 'name' }),
    }));
    return { count: items.length, truncated, items };
  },
});
