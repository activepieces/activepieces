import { createAction } from '@activepieces/pieces-framework';
import { BikaAuth } from '../../auth';
import { bikaOperations } from '../../common/operations';
import { bikaProps } from '../../common/props';
import { bikaOutputSchemas } from '../../output-schemas';

export const listDatabasesByIdAction = createAction({
  auth: BikaAuth,
  name: 'list_databases_by_id',
  classification: 'SEARCH',
  displayName: 'List Databases',
  description: 'Lists the databases in a space.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists the databases (tables) in a Bika.ai space, given its space ID from List Spaces, with each database ID, name and folder path (first 200). Use it to find the database ID that Get Database Fields and the record actions need. Read-only.',
    idempotent: true,
  },
  props: {
    space_id: bikaProps.spaceIdText(),
  },
  outputSchema: bikaOutputSchemas.databases,
  async run(context) {
    return bikaOperations.listDatabases({ auth: context.auth, spaceId: context.propsValue.space_id });
  },
});
