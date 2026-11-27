import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { sageIntacctAuth } from '../auth';
import { sageIntacctRecords, sageIntacctSchemas } from '../common/output-schemas';
import { sageIntacctPoll } from '../common/poll';

const STORE_KEY = 'sage_intacct_new_vendor_state';

export const newVendorTrigger = createTrigger({
  auth: sageIntacctAuth,
  name: 'new_vendor',
  displayName: 'New Vendor',
  description: 'Triggers when a vendor is created in Sage Intacct.',
  classification: 'READ',
  aiMetadata: {
    description:
      'Fires once per vendor created in Sage Intacct after the trigger is enabled, polling on the server-side creation timestamp; vendors that existed before enabling are not replayed. The payload is the vendor: key (record number), id, name, status, default-contact name, email and phone, mailing address, total due and created/modified timestamps.',
  },
  type: TriggerStrategy.POLLING,
  props: {},
  outputSchema: sageIntacctSchemas.vendor,
  sampleData: {
    key: '87',
    id: 'VEND-0087',
    name: 'Northwind Supplies',
    status: 'active',
    print_as: 'Northwind Supplies',
    company_name: 'Northwind Supplies',
    first_name: 'Jane',
    last_name: 'Doe',
    email: 'jane.doe@example.com',
    phone: '+1 415 555 0100',
    address_line_1: '100 Market Street',
    address_line_2: null,
    city: 'San Francisco',
    state: 'CA',
    postal_code: '94105',
    country: 'United States',
    total_due: 0,
    created_at: '2026-11-18T09:30:00Z',
    modified_at: '2026-11-18T09:30:00Z',
  },
  async onEnable(context) {
    await sageIntacctPoll.enable({
      auth: context.auth,
      store: context.store,
      storeKey: STORE_KEY,
      isRepublish: context.isRepublish,
      object: sageIntacctRecords.VENDOR_OBJECT,
    });
  },
  async onDisable() {
    await sageIntacctPoll.disable();
  },
  async test(context) {
    const records = await sageIntacctPoll.newestRecords({
      auth: context.auth,
      object: sageIntacctRecords.VENDOR_OBJECT,
      fields: sageIntacctRecords.partyQueryFields(),
    });
    return records.map((record) => sageIntacctRecords.toParty(record));
  },
  async run(context) {
    const records = await sageIntacctPoll.pollNewRecords({
      auth: context.auth,
      store: context.store,
      storeKey: STORE_KEY,
      object: sageIntacctRecords.VENDOR_OBJECT,
      fields: sageIntacctRecords.partyQueryFields(),
    });
    return records.map((record) => sageIntacctRecords.toParty(record));
  },
});
