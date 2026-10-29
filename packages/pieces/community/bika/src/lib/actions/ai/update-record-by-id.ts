import { createAction, Property } from '@activepieces/pieces-framework';
import { BikaAuth } from '../../auth';
import { bikaOperations } from '../../common/operations';
import { bikaProps } from '../../common/props';
import { bikaOutputSchemas } from '../../output-schemas';

export const updateRecordByIdAction = createAction({
  auth: BikaAuth,
  name: 'update_record_by_id',
  classification: 'WRITE',
  displayName: 'Update Record (by ID)',
  description: 'Updates fields of a record from a JSON object of field values.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Updates one Bika.ai record, given its space, database and record IDs, from a JSON object keyed by exact field names; only the listed fields change and null clears a field. Value formats are the same as Create Record (by ID). Repeating the call with the same values leaves the record in the same state.',
    idempotent: true,
  },
  props: {
    space_id: bikaProps.spaceIdText(),
    database_id: bikaProps.databaseIdText(),
    record_id: bikaProps.recordIdText({ description: 'The ID of the record to update (starts with "rec").' }),
    fields: Property.Json({
      displayName: 'Fields',
      description: 'Field values to change, keyed by field name, for example {"Stage": "Close Deals", "Notes": null}.',
      required: true,
      defaultValue: {},
    }),
  },
  outputSchema: bikaOutputSchemas.agentRecord,
  async run(context) {
    return bikaOperations.agentUpdate({
      auth: context.auth,
      spaceId: context.propsValue.space_id,
      databaseId: context.propsValue.database_id,
      recordId: context.propsValue.record_id,
      fields: context.propsValue.fields,
    });
  },
});
