import { Property, createAction } from '@activepieces/pieces-framework';
import { zohoCrmAuth } from '../auth';
import { parseTriggers, requireApiName, requireId, stringList } from '../common/client';
import { buildRecordPayload } from '../common/fields';
import { additionalFieldsProp, moduleDropdown, recordDropdown, recordFieldsProp } from '../common/props';
import { tryListFields, updateRecord } from '../common/records';
import { recordWriteOutputSchema } from '../output-schemas';

export const updateRecordAction = createAction({
  auth: zohoCrmAuth,
  name: 'update_record',
  classification: 'WRITE',
  displayName: 'Update Record',
  description: 'Updates fields of a record in any module. Fields left empty are not changed.',
  audience: 'human',
  aiMetadata: {
    description:
      'Updates selected fields of one existing Zoho CRM record by module and id; fields left empty keep their current value, and "Clear Fields" blanks named fields. Multi-select picklists are replaced, not merged. Not idempotent: every call counts as an edit and runs the module\'s on-edit workflows unless automation is skipped.',
    idempotent: false,
  },
  props: {
    module: moduleDropdown({ filter: 'editable' }),
    record_id: recordDropdown(),
    fields: recordFieldsProp({ mode: 'update' }),
    clear_fields: Property.Array({
      displayName: 'Clear Fields',
      description: 'Field API names to set to empty (e.g. "Phone", "Custom_Field__c").',
      required: false,
    }),
    additional_fields: additionalFieldsProp(),
    skip_automation: Property.Checkbox({
      displayName: 'Skip All Automation',
      description: 'Run no workflow, approval or blueprint for this update.',
      required: false,
      defaultValue: false,
    }),
  },
  outputSchema: recordWriteOutputSchema,
  async run({ auth, propsValue }) {
    const module = requireApiName({ value: propsValue.module, name: 'Module' });
    const id = requireId({ value: propsValue.record_id, name: 'Record' });
    const clearFields = stringList(propsValue.clear_fields).map((f) => requireApiName({ value: f, name: 'Clear Fields' }));
    const fields = await tryListFields({ auth, module });
    const record = buildRecordPayload({
      dynamicValues: propsValue.fields,
      fields,
      extraFields: propsValue.additional_fields,
      clearFields,
    });
    return updateRecord({ auth, module, id, record, trigger: parseTriggers({ value: undefined, skipAll: propsValue.skip_automation }) });
  },
});
