import { createAction, Property } from '@activepieces/pieces-framework';
import { BikaAuth } from '../../auth';
import { bikaOperations } from '../../common/operations';
import { bikaProps } from '../../common/props';
import { bikaOutputSchemas } from '../../output-schemas';

export const createRecordByIdAction = createAction({
  auth: BikaAuth,
  name: 'create_record_by_id',
  classification: 'WRITE',
  displayName: 'Create Record (by ID)',
  description: 'Creates a record from a JSON object of field values.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Creates one record in a Bika.ai database, given its space and database IDs, from a JSON object keyed by exact field names (from Get Database Fields). Formats: text, URL, email and phone as strings; numbers as numbers; checkbox as true/false; single select as the option name; multi select as a list of option names; member as a list of member IDs; link as a list of record IDs; date as ISO 8601; date range as "start/end". Leave out read-only fields (formula, lookup, auto number, created/modified time and by). Each call adds a new record, so a retry creates a duplicate.',
    idempotent: false,
  },
  props: {
    space_id: bikaProps.spaceIdText(),
    database_id: bikaProps.databaseIdText(),
    fields: Property.Json({
      displayName: 'Fields',
      description: 'Field values keyed by field name, for example {"Full name": "Ada Lovelace", "Stage": "Identify Needs"}.',
      required: true,
      defaultValue: {},
    }),
  },
  outputSchema: bikaOutputSchemas.agentRecord,
  async run(context) {
    return bikaOperations.agentCreate({
      auth: context.auth,
      spaceId: context.propsValue.space_id,
      databaseId: context.propsValue.database_id,
      fields: context.propsValue.fields,
    });
  },
});
