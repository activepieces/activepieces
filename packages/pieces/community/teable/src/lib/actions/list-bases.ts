import { createAction } from '@activepieces/pieces-framework';
import { TeableAuth } from '../auth';
import { teableClient } from '../common/client';
import { teableOutputSchemas } from '../output-schemas';

export const listBasesAction = createAction({
  auth: TeableAuth,
  name: 'teable_list_bases',
  classification: 'READ',
  displayName: 'List Bases',
  description: 'Lists all bases the connection has access to.',
  audience: 'both',
  aiMetadata: {
    description:
      'Returns every Teable base this connection can access, with its ID, name, space ID, and role. Call this first to find the base ID the other actions need. Read-only.',
    idempotent: true,
  },
  props: {},
  outputSchema: teableOutputSchemas.listBases,
  async run(context) {
    return teableClient.listBases({ auth: context.auth });
  },
});
