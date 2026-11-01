import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { zohoCrmAuth } from '../auth';
import { requireApiName } from '../common/client';
import { recordOutputSchema } from '../output-schemas';
import { pollModule, recordTriggerProps, sampleModule, startTrigger, triggerFields } from '../common/record-trigger';

export const newRecordTrigger = createTrigger({
  auth: zohoCrmAuth,
  name: 'new_record',
  classification: 'READ',
  displayName: 'New Record',
  description: 'Triggers when a record is created in any module (custom fields included).',
  aiMetadata: {
    description:
      'Fires once per record newly created in the chosen Zoho CRM module (standard or custom), emitting the record with its field API names as keys, custom fields included (up to 50 fields). Polls by Created_Time.',
  },
  props: recordTriggerProps,
  sampleData: {
    id: '5725767000000524157',
    Last_Name: 'Doe',
    First_Name: 'Jane',
    Email: 'jane.doe@example.com',
    Company: 'Acme Inc',
    Lead_Source: 'Web Download',
    Custom_Field__c: 'value',
    Owner: { name: 'Jane Admin', id: '5725767000000411001', email: 'admin@example.com' },
    Created_Time: '2026-09-29T10:15:00+02:00',
    Modified_Time: '2026-09-29T10:15:00+02:00',
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
      sortBy: 'Created_Time',
    });
  },
  async test(context) {
    const module = requireApiName({ value: context.propsValue.module, name: 'Module' });
    return sampleModule({
      auth: context.auth,
      module,
      fields: await triggerFields({ auth: context.auth, module, chosen: context.propsValue.fields }),
      sortBy: 'Created_Time',
    });
  },
});
