import { createAction } from '@activepieces/pieces-framework';
import { zohoCrmAuth } from '../auth';
import { requireApiName, requireId } from '../common/client';
import { moduleDropdown, recordDropdown } from '../common/props';
import { getRecord } from '../common/records';
import { recordOutputSchema } from '../output-schemas';

export const getRecordAction = createAction({
  auth: zohoCrmAuth,
  name: 'get_record',
  classification: 'READ',
  displayName: 'Get Record',
  description: 'Gets a record by id from any module, with all its fields.',
  audience: 'human',
  aiMetadata: {
    description:
      'Fetches one Zoho CRM record by module and id with all its fields (keys are field API names, custom fields included). Use when you know the record id. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    module: moduleDropdown(),
    record_id: recordDropdown(),
  },
  outputSchema: recordOutputSchema,
  async run({ auth, propsValue }) {
    return getRecord({
      auth,
      module: requireApiName({ value: propsValue.module, name: 'Module' }),
      id: requireId({ value: propsValue.record_id, name: 'Record' }),
    });
  },
});
