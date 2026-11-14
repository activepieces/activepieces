import { TriggerStrategy, createTrigger } from '@activepieces/pieces-framework';
import { dynamicsCRMAuth } from '../auth';
import { makeClient } from '../common';
import { leadOutputSchema, outputKeys } from '../common/output-schemas';
import { PollConfig, dynamicsPolling } from '../common/polling';

export const newLeadTrigger = createTrigger({
  auth: dynamicsCRMAuth,
  name: 'new_lead',
  classification: 'READ',
  displayName: 'New Lead',
  description: 'Triggers when a new lead is created.',
  aiMetadata: {
    description: 'Fires once per new Dynamics 365 lead, with its main fields.',
  },
  props: {},
  type: TriggerStrategy.POLLING,
  sampleData: {
    leadid: '0a1b2c3d-4e5f-ef11-8406-000d3a4f1234',
    subject: 'Interested in 20 licenses',
    fullname: 'Jane Doe',
    firstname: 'Jane',
    lastname: 'Doe',
    companyname: 'Contoso',
    emailaddress1: 'jane@example.com',
    createdon: '2026-11-14T09:30:00Z',
    modifiedon: '2026-11-14T09:30:00Z',
    statecode: 0,
    statuscode: 1,
  },
  outputSchema: leadOutputSchema,
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

const CONFIG: PollConfig = { entitySet: 'leads', primaryId: 'leadid', column: 'createdon', outputKeys: outputKeys.lead };
