import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { sageIntacctAuth } from '../auth';
import { sageIntacctRecords, sageIntacctSchemas } from '../common/output-schemas';
import { sageIntacctPoll } from '../common/poll';

const STORE_KEY = 'sage_intacct_new_contact_state';

export const newContactTrigger = createTrigger({
  auth: sageIntacctAuth,
  name: 'new_contact',
  displayName: 'New Contact',
  description:
    'Triggers when a contact is created in Sage Intacct, including the default contacts Sage Intacct creates automatically with new customers and vendors.',
  classification: 'READ',
  aiMetadata: {
    description:
      'Fires once per contact created in Sage Intacct after the trigger is enabled, polling on the contact record number because the contact API carries no timestamps; existing contacts are not replayed. It also fires for the default contacts Sage Intacct auto-creates with new customers and vendors. The payload is the contact: key, contact name (its ID), print_as, first and last name, company, email, phone, mobile, status and mailing address.',
  },
  type: TriggerStrategy.POLLING,
  props: {},
  outputSchema: sageIntacctSchemas.contact,
  sampleData: {
    key: '312',
    id: 'Doe, Jane',
    print_as: 'Jane Doe',
    first_name: 'Jane',
    last_name: 'Doe',
    company_name: 'Acme Corporation',
    email: 'jane.doe@example.com',
    phone: '+1 415 555 0100',
    mobile: null,
    status: 'active',
    address_line_1: '100 Market Street',
    address_line_2: null,
    city: 'San Francisco',
    state: 'CA',
    postal_code: '94105',
    country: 'United States',
  },
  async onEnable(context) {
    await sageIntacctPoll.enableByKey({
      auth: context.auth,
      store: context.store,
      storeKey: STORE_KEY,
      isRepublish: context.isRepublish,
      object: sageIntacctRecords.CONTACT_OBJECT,
    });
  },
  async onDisable() {
    await sageIntacctPoll.disable();
  },
  async test(context) {
    const records = await sageIntacctPoll.newestRecordsByKey({
      auth: context.auth,
      object: sageIntacctRecords.CONTACT_OBJECT,
      fields: sageIntacctRecords.CONTACT_QUERY_FIELDS,
    });
    return records.map((record) => sageIntacctRecords.toContact(record));
  },
  async run(context) {
    const records = await sageIntacctPoll.pollNewRecordsByKey({
      auth: context.auth,
      store: context.store,
      storeKey: STORE_KEY,
      object: sageIntacctRecords.CONTACT_OBJECT,
      fields: sageIntacctRecords.CONTACT_QUERY_FIELDS,
    });
    return records.map((record) => sageIntacctRecords.toContact(record));
  },
});
