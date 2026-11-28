import { TriggerStrategy, createTrigger } from '@activepieces/pieces-framework';
import { dynamicsCRMAuth } from '../auth';
import { makeClient } from '../common';
import { contactOutputSchema, outputKeys } from '../common/output-schemas';
import { PollConfig, dynamicsPolling } from '../common/polling';

export const newContactTrigger = createTrigger({
  auth: dynamicsCRMAuth,
  name: 'new_contact',
  classification: 'READ',
  displayName: 'New Contact',
  description: 'Triggers when a new contact is created.',
  aiMetadata: {
    description: 'Fires once per new Dynamics 365 contact, with its main fields.',
  },
  props: {},
  type: TriggerStrategy.POLLING,
  sampleData: {
    contactid: '6f3c6d2a-4b1e-ef11-8406-000d3a4f1234',
    fullname: 'Jane Doe',
    firstname: 'Jane',
    lastname: 'Doe',
    emailaddress1: 'jane@example.com',
    _parentcustomerid_value: '1d2e3f4a-5b6c-ef11-8406-000d3a4f1234',
    createdon: '2026-11-14T09:30:00Z',
    modifiedon: '2026-11-14T09:30:00Z',
    statecode: 0,
    statuscode: 1,
  },
  outputSchema: contactOutputSchema,
  async onEnable(context) {
    await dynamicsPolling.onEnable({
      client: makeClient(context.auth),
      store: context.store,
      config: CONFIG,
      isRepublish: context.isRepublish,
    });
  },
  async onDisable(context) {
    await dynamicsPolling.onDisable({ store: context.store });
  },
  async test(context) {
    return dynamicsPolling.test({ client: makeClient(context.auth), config: CONFIG });
  },
  async run(context) {
    return dynamicsPolling.poll({ client: makeClient(context.auth), store: context.store, config: CONFIG });
  },
});

const CONFIG: PollConfig = { entitySet: 'contacts', primaryId: 'contactid', column: 'createdon', outputKeys: outputKeys.contact };
