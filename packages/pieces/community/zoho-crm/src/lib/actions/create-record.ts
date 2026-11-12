import { Property, createAction } from '@activepieces/pieces-framework';
import { zohoCrmAuth } from '../auth';
import { WORKFLOW_TRIGGERS, parseTriggers, requireApiName } from '../common/client';
import { buildRecordPayload } from '../common/fields';
import { additionalFieldsProp, moduleDropdown, recordFieldsProp } from '../common/props';
import { createRecord, tryListFields } from '../common/records';
import { recordWriteOutputSchema } from '../output-schemas';

export const createRecordAction = createAction({
  auth: zohoCrmAuth,
  name: 'create_record',
  classification: 'WRITE',
  displayName: 'Create Record',
  description: 'Creates a record in any module, including custom fields.',
  audience: 'human',
  aiMetadata: {
    description:
      'Creates one record in a chosen Zoho CRM module (standard or custom) from a form of that module\'s fields, custom fields included. Use to add a lead, contact, deal or custom-module record; use Create or Update Record instead when the record may already exist. Not idempotent: each call creates a new record.',
    idempotent: false,
  },
  props: {
    module: moduleDropdown({ filter: 'creatable' }),
    fields: recordFieldsProp({ mode: 'create' }),
    additional_fields: additionalFieldsProp(),
    triggers: Property.StaticMultiSelectDropdown({
      displayName: 'Automation to Run',
      description: 'Empty runs Zoho\'s default workflows; pick some to run only those.',
      required: false,
      options: { options: WORKFLOW_TRIGGERS.map((t) => ({ label: t, value: t })) },
    }),
    skip_automation: Property.Checkbox({
      displayName: 'Skip All Automation',
      description: 'Run no workflow, approval or blueprint for this record.',
      required: false,
      defaultValue: false,
    }),
  },
  outputSchema: recordWriteOutputSchema,
  async run({ auth, propsValue }) {
    const module = requireApiName({ value: propsValue.module, name: 'Module' });
    const fields = await tryListFields({ auth, module });
    const record = buildRecordPayload({
      dynamicValues: propsValue.fields,
      fields,
      extraFields: propsValue.additional_fields,
    });
    return createRecord({
      auth,
      module,
      record,
      trigger: parseTriggers({ value: propsValue.triggers, skipAll: propsValue.skip_automation }),
    });
  },
});
