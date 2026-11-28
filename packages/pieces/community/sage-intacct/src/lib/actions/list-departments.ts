import { createAction } from '@activepieces/pieces-framework';
import { sageIntacctAuth } from '../auth';
import { sageIntacctClient } from '../common/client';

export const listDepartmentsAction = createAction({
  auth: sageIntacctAuth,
  name: 'list_departments',
  displayName: 'List Departments',
  description: 'List the departments of the Sage Intacct company.',
  classification: 'READ',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists the departments of the connected Sage Intacct company, up to 1000, with key, id and name. Use it to discover the department_id to put on invoice or bill lines when the company requires a department dimension. Read-only.',
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
          { key: 'id', label: 'Department ID' },
          { key: 'name', label: 'Name' },
        ],
      },
    ],
  },
  async run(context) {
    const { records, truncated } = await sageIntacctClient.queryAll({
      auth: context.auth,
      object: 'company-config/department',
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
