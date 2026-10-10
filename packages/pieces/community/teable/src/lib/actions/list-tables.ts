import { createAction } from '@activepieces/pieces-framework';
import { TeableAuth } from '../auth';
import { TeableCommon } from '../common';
import { teableClient } from '../common/client';
import { teableOutputSchemas } from '../output-schemas';

export const listTablesAction = createAction({
  auth: TeableAuth,
  name: 'teable_list_tables',
  classification: 'READ',
  displayName: 'List Tables',
  description: 'Lists all tables in a base.',
  audience: 'human',
  aiMetadata: {
    description:
      'Returns every table in a Teable base, with its ID, name, and description. Needs the base ID from List Bases. Read-only.',
    idempotent: true,
  },
  props: {
    base_id: TeableCommon.base_id,
  },
  outputSchema: teableOutputSchemas.listTables,
  async run(context) {
    return teableClient.listTables({ auth: context.auth, baseId: context.propsValue.base_id });
  },
});
