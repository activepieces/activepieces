import { createAction } from '@activepieces/pieces-framework';
import { BikaAuth } from '../auth';
import { bikaOperations } from '../common/operations';
import { bikaProps } from '../common/props';
import { bikaOutputSchemas } from '../output-schemas';

export const createRecordAction = createAction({
  auth: BikaAuth,
  name: 'bika_create_record',
  classification: 'WRITE',
  displayName: 'Create Record',
  description: 'Creates a new record in a Bika database.',
  audience: 'human',
  aiMetadata: {
    description:
      'Creates one record in a Bika.ai database picked from dropdowns, with one input per writable field; files given for attachment fields are uploaded first. Read-only fields (formula, lookup, auto number, created/modified time and by) are not offered. Each call adds a new record, so a retry creates a duplicate.',
    idempotent: false,
  },
  props: {
    space_id: bikaProps.space(),
    database_id: bikaProps.database(),
    fields: bikaProps.fields({ description: 'The values for the new record. Empty inputs are left blank.' }),
  },
  propertyGroups: [
    { key: 'database', display: 'section', label: 'Location', icon: 'inbox', props: ['space_id', 'database_id'] },
    { key: 'values', display: 'section', label: 'Values', icon: 'text', props: ['fields'] },
  ],
  outputSchema: bikaOutputSchemas.humanCreatedRecord,
  async run(context) {
    return bikaOperations.humanCreate({
      auth: context.auth,
      spaceId: context.propsValue.space_id,
      databaseId: context.propsValue.database_id,
      fields: context.propsValue.fields,
    });
  },
});
