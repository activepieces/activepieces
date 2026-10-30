import { createAction } from '@activepieces/pieces-framework';
import { BikaAuth } from '../../auth';
import { bikaOperations } from '../../common/operations';
import { bikaProps } from '../../common/props';
import { bikaOutputSchemas } from '../../output-schemas';

export const getDatabaseFieldsByIdAction = createAction({
  auth: BikaAuth,
  name: 'get_database_fields_by_id',
  classification: 'READ',
  displayName: 'Get Database Fields',
  description: 'Lists the fields (columns) of a database.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Returns the fields (columns) of a Bika.ai database, given its space and database IDs: exact name, type, whether it is writable, the value format to write, and option names for select fields. Call it before creating, updating or filtering records so field names and values match. Read-only.',
    idempotent: true,
  },
  props: {
    space_id: bikaProps.spaceIdText(),
    database_id: bikaProps.databaseIdText(),
  },
  outputSchema: bikaOutputSchemas.fields,
  async run(context) {
    return bikaOperations.getFields({
      auth: context.auth,
      spaceId: context.propsValue.space_id,
      databaseId: context.propsValue.database_id,
    });
  },
});
