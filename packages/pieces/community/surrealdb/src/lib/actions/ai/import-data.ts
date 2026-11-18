import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { surrealdbAuth } from '../../auth';
import { surrealdbClient } from '../../common/client';
import { surrealdbImportDataOutputSchema } from '../../output-schemas';

export const importDataAction = createAction({
  auth: surrealdbAuth,
  name: 'surrealdb_import_data',
  outputSchema: surrealdbImportDataOutputSchema,
  displayName: 'Import Data',
  description: 'Imports a SurrealQL script or export file into the database.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description: 'Runs a SurrealQL script (such as a file from Export Database) against the connection\'s database in import mode: events and field processing are skipped. Pass the script as text or as a file, not both. Statements that fail are reported with HTTP 422, but earlier statements stay applied (no rollback), and DEFINE ... OVERWRITE or DELETE statements in the script replace data. Not idempotent.',
    idempotent: false,
  },
  props: {
    script: Property.LongText({
      displayName: 'Script',
      description: 'SurrealQL statements to import, e.g. CREATE person:tobie SET name = "Tobie";. Leave empty when using File.',
      required: false,
    }),
    file: Property.File({
      displayName: 'File',
      description: 'A .surql file to import, such as one from Export Database. Leave empty when using Script.',
      required: false,
    }),
  },
  async run(context) {
    const { script, file } = context.propsValue;
    if ((script === undefined || script === '') === (file === undefined || file === null)) {
      throw new Error('Provide exactly one of Script or File.');
    }
    const text = file ? file.data.toString('utf8') : script ?? '';
    const body = IMPORT_OPTION.test(text) ? text : `OPTION IMPORT;\n${text}`;
    await surrealdbClient.request<unknown>({
      auth: context.auth,
      method: HttpMethod.POST,
      path: '/import',
      headers: { 'Content-Type': 'text/plain' },
      body,
    });
    return { success: true, size_bytes: Buffer.byteLength(body, 'utf8') };
  },
});

const IMPORT_OPTION = /^\s*(--[^\n]*\n\s*)*OPTION\s+IMPORT\s*;/i;
