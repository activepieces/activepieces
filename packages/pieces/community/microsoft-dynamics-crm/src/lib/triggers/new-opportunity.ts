import { TriggerStrategy, createTrigger } from '@activepieces/pieces-framework';
import { dynamicsCRMAuth } from '../auth';
import { makeClient } from '../common';
import { opportunityOutputSchema, outputKeys } from '../common/output-schemas';
import { PollConfig, dynamicsPolling } from '../common/polling';

export const newOpportunityTrigger = createTrigger({
  auth: dynamicsCRMAuth,
  name: 'new_opportunity',
  classification: 'READ',
  displayName: 'New Opportunity',
  description: 'Triggers when a new opportunity is created.',
  aiMetadata: {
    description: 'Fires once per new Dynamics 365 opportunity, with its main fields.',
  },
  props: {},
  type: TriggerStrategy.POLLING,
  sampleData: {
    opportunityid: '9a8b7c6d-5e4f-ef11-8406-000d3a4f1234',
    name: '20 licenses for Contoso',
    estimatedvalue: 20000,
    estimatedclosedate: '2026-12-31',
    _customerid_value: '1d2e3f4a-5b6c-ef11-8406-000d3a4f1234',
    createdon: '2026-11-14T09:30:00Z',
    modifiedon: '2026-11-14T09:30:00Z',
    statecode: 0,
    statuscode: 1,
  },
  outputSchema: opportunityOutputSchema,
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

const CONFIG: PollConfig = { entitySet: 'opportunities', primaryId: 'opportunityid', column: 'createdon', outputKeys: outputKeys.opportunity };
