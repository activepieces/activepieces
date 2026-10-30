import { createAction } from '@activepieces/pieces-framework';
import { TeableAuth } from '../auth';
import { TeableCommon } from '../common';
import { teableClient } from '../common/client';
import { teableOutputSchemas } from '../output-schemas';

export const listFieldsAction = createAction({
  auth: TeableAuth,
  name: 'teable_list_fields',
  classification: 'READ',
  displayName: 'List Fields',
  description: 'Lists all fields of a table.',
  audience: 'human',
  aiMetadata: {
    description:
      'Returns every field of a Teable table, with its ID, name, type, and select options. Read-only.',
    idempotent: true,
  },
  props: {
    base_id: TeableCommon.base_id,
    table_id: TeableCommon.table_id,
  },
  outputSchema: teableOutputSchemas.listFields,
  async run(context) {
    return teableClient.listFields({ auth: context.auth, tableId: context.propsValue.table_id });
  },
});
