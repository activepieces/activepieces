import { createTrigger, Property, TriggerStrategy } from '@activepieces/pieces-framework';
import { zohoCrmAuth } from '../auth';
import { requireApiName } from '../common/client';
import { recordOutputSchema } from '../output-schemas';
import { ZohoRecord } from '../common/polling';
import { pollModule, recordTriggerProps, sampleModule, startTrigger, triggerFields } from '../common/record-trigger';

export function isUpdateOnly(record: ZohoRecord): boolean {
  return record['Modified_Time'] !== record['Created_Time'];
}

export const updatedRecordTrigger = createTrigger({
  auth: zohoCrmAuth,
  name: 'updated_record',
  classification: 'READ',
  displayName: 'Updated Record',
  description: 'Triggers when a record is modified in any module.',
  aiMetadata: {
    description:
      'Fires once per record modified in the chosen Zoho CRM module since the last poll, emitting the record at its latest state (up to 50 fields, custom fields included). Polls by Modified_Time; by default records that were only created (never edited) are skipped, and several edits between two polls produce one event.',
  },
  props: {
    ...recordTriggerProps,
    include_new: Property.Checkbox({
      displayName: 'Include Newly Created Records',
      description: 'Also fire for records created but not edited since the last check.',
      required: false,
      defaultValue: false,
    }),
  },
  sampleData: {
    id: '5725767000000524157',
    Last_Name: 'Doe',
    Email: 'jane.doe@example.com',
    Lead_Status: 'Contacted',
    Created_Time: '2026-09-28T10:15:00+02:00',
    Modified_Time: '2026-09-29T11:02:41+02:00',
    Modified_By: { name: 'Jane Admin', id: '5725767000000411001', email: 'admin@example.com' },
  },
  type: TriggerStrategy.POLLING,
  outputSchema: recordOutputSchema,
  async onEnable(context) {
    const module = requireApiName({ value: context.propsValue.module, name: 'Module' });
    await startTrigger({ auth: context.auth, module, store: context.store, isRepublish: context.isRepublish, chosen: context.propsValue.fields });
  },
  async onDisable() {
  },
  async run(context) {
    const module = requireApiName({ value: context.propsValue.module, name: 'Module' });
    return pollModule({
      auth: context.auth,
      store: context.store,
      module,
      fields: await triggerFields({ auth: context.auth, store: context.store, module, chosen: context.propsValue.fields }),
      sortBy: 'Modified_Time',
      keep: context.propsValue.include_new === true ? undefined : isUpdateOnly,
    });
  },
  async test(context) {
    const module = requireApiName({ value: context.propsValue.module, name: 'Module' });
    return sampleModule({
      auth: context.auth,
      module,
      fields: await triggerFields({ auth: context.auth, module, chosen: context.propsValue.fields }),
      sortBy: 'Modified_Time',
      keep: context.propsValue.include_new === true ? undefined : isUpdateOnly,
    });
  },
});
