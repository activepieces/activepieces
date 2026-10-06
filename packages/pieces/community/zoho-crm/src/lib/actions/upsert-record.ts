import { Property, createAction } from '@activepieces/pieces-framework';
import { zohoCrmAuth } from '../auth';
import { parseTriggers, requireApiName, stringList } from '../common/client';
import { buildRecordPayload } from '../common/fields';
import { additionalFieldsProp, moduleDropdown, recordFieldsProp, uniqueFieldsDropdown } from '../common/props';
import { tryListFields, upsertRecord } from '../common/records';
import { upsertOutputSchema } from '../output-schemas';

export const upsertRecordAction = createAction({
  auth: zohoCrmAuth,
  name: 'upsert_record',
  classification: 'WRITE',
  displayName: 'Create or Update Record',
  description: 'Updates the record that matches on the duplicate-check fields, or creates it if none matches.',
  audience: 'human',
  aiMetadata: {
    description:
      'Inserts or updates one Zoho CRM record, matching an existing record on duplicate-check fields (Zoho default: Email for Leads/Contacts, Account_Name for Accounts, Deal_Name for Deals). Use for find-or-create without search. Not idempotent: when the data has no value for a duplicate-check field, every call inserts a new record.',
    idempotent: false,
  },
  props: {
    module: moduleDropdown({ filter: 'creatable' }),
    duplicate_check_fields: uniqueFieldsDropdown(),
    fields: recordFieldsProp({ mode: 'upsert' }),
    additional_fields: additionalFieldsProp(),
    skip_automation: Property.Checkbox({
      displayName: 'Skip All Automation',
      required: false,
      defaultValue: false,
    }),
  },
  outputSchema: upsertOutputSchema,
  async run({ auth, propsValue }) {
    const module = requireApiName({ value: propsValue.module, name: 'Module' });
    const fields = await tryListFields({ auth, module });
    const record = buildRecordPayload({ dynamicValues: propsValue.fields, fields, extraFields: propsValue.additional_fields });
    return upsertRecord({
      auth,
      module,
      record,
      duplicateCheckFields: stringList(propsValue.duplicate_check_fields).map((f) => requireApiName({ value: f, name: 'Duplicate Check Fields' })),
      trigger: parseTriggers({ value: undefined, skipAll: propsValue.skip_automation }),
    });
  },
});
