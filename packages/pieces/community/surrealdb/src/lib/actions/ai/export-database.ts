import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { surrealdbAuth } from '../../auth';
import { surrealdbClient } from '../../common/client';
import { surrealdbExportDatabaseOutputSchema } from '../../output-schemas';

export const exportDatabaseAction = createAction({
  auth: surrealdbAuth,
  name: 'surrealdb_export_database',
  outputSchema: surrealdbExportDatabaseOutputSchema,
  displayName: 'Export Database',
  description: 'Exports the database as a SurrealQL file.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description: 'Exports the connection\'s database (definitions and, by default, records) as a SurrealQL file and returns a link to it, which Import Data accepts. Limit it to some tables, or to definitions only. Needs the VIEWER role or above. Read-only.',
    idempotent: true,
  },
  props: {
    tables: Property.Array({
      displayName: 'Tables',
      description: 'Only export these tables, e.g. ["person", "knows"]. Leave empty for all tables.',
      required: false,
    }),
    includeRecords: Property.StaticDropdown({
      displayName: 'Include Records',
      description: 'true to export the records as well as the definitions, false for definitions only. Defaults to true.',
      required: false,
      options: { options: [{ label: 'Yes', value: 'true' }, { label: 'No', value: 'false' }] },
    }),
  },
  async run(context) {
    const { tables, includeRecords } = context.propsValue;
    if (includeRecords !== undefined && includeRecords !== 'true' && includeRecords !== 'false') {
      throw new Error('Include Records must be "true" or "false".');
    }
    const selected = (tables ?? []).map(String);
    const dump = await surrealdbClient.request<string>({
      auth: context.auth,
      method: HttpMethod.POST,
      path: '/export',
      headers: { 'Content-Type': 'application/json' },
      body: {
        ...(selected.length > 0 ? { tables: selected } : {}),
        ...(includeRecords !== undefined ? { records: includeRecords === 'true' } : {}),
      },
      responseType: 'text',
    });
    const fileName = `${context.auth.props.namespace}-${context.auth.props.database}.surql`;
    const file = await context.files.write({ fileName, data: Buffer.from(dump, 'utf8') });
    return { file, file_name: fileName, size_bytes: Buffer.byteLength(dump, 'utf8') };
  },
});
