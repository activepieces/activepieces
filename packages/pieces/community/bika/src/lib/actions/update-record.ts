import { createAction, MarkdownVariant, Property } from '@activepieces/pieces-framework';
import { BikaAuth } from '../auth';
import { bikaOperations } from '../common/operations';
import { bikaProps } from '../common/props';
import { bikaOutputSchemas } from '../output-schemas';

export const updateRecordAction = createAction({
  auth: BikaAuth,
  name: 'bika_update_record',
  classification: 'WRITE',
  displayName: 'Update Record',
  description: 'Updates the fields of an existing record in a Bika database.',
  audience: 'human',
  aiMetadata: {
    description:
      'Updates the fields of one existing Bika.ai record, given its record ID, in a database picked from dropdowns. Only the fields you fill in are changed; empty inputs keep their current value. Repeating the call with the same values leaves the record in the same state.',
    idempotent: true,
  },
  props: {
    space_id: bikaProps.space(),
    database_id: bikaProps.database(),
    recordId: bikaProps.recordId({ description: 'The record ID, mapped from a Find Records or Create Record step.' }),
    changes_info: Property.MarkDown({ value: 'Empty fields keep their current value.', variant: MarkdownVariant.INFO }),
    fields: bikaProps.fields({ description: 'The new values. Empty inputs keep their current value.' }),
  },
  propertyGroups: [
    { key: 'record', display: 'section', label: 'Record', icon: 'file', props: ['space_id', 'database_id', 'recordId'] },
    { key: 'changes', display: 'section', label: 'Changes', icon: 'text', props: ['changes_info', 'fields'] },
  ],
  outputSchema: bikaOutputSchemas.humanRecord,
  async run(context) {
    return bikaOperations.humanUpdate({
      auth: context.auth,
      spaceId: context.propsValue.space_id,
      databaseId: context.propsValue.database_id,
      recordId: context.propsValue.recordId,
      fields: context.propsValue.fields,
    });
  },
});
