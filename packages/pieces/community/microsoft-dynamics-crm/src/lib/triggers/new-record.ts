import { TriggerStrategy, createTrigger } from '@activepieces/pieces-framework';
import { dynamicsCRMAuth } from '../auth';
import { DynamicsCRMCommon, makeClient } from '../common';
import { outputKeys, recordOutputSchema } from '../common/output-schemas';
import { PollConfig, dynamicsPolling } from '../common/polling';
import { DynamicsAuthValue } from '../common/types';

export const newRecordTrigger = createTrigger({
  auth: dynamicsCRMAuth,
  name: 'new_record',
  classification: 'READ',
  displayName: 'New Record',
  description: 'Triggers when a record is created in the selected table.',
  aiMetadata: {
    description: 'Fires once per record created in the chosen Dynamics 365 table (checked every poll, ordered by createdon).',
  },
  props: {
    entityType: DynamicsCRMCommon.entityType('The table to watch for new records.'),
  },
  type: TriggerStrategy.POLLING,
  sampleData: {
    id: '6f3c6d2a-4b1e-ef11-8406-000d3a4f1234',
    entitySet: 'contacts',
    etag: 'W/"5123456"',
    contactid: '6f3c6d2a-4b1e-ef11-8406-000d3a4f1234',
    fullname: 'Jane Doe',
    emailaddress1: 'jane@example.com',
    createdon: '2026-11-14T09:30:00Z',
    modifiedon: '2026-11-14T09:30:00Z',
    statecode: 0,
    statecode_formatted: 'Active',
  },
  outputSchema: recordOutputSchema,
  async onEnable(context) {
    await dynamicsPolling.onEnable({
      client: makeClient(context.auth),
      store: context.store,
      config: await newRecordConfig({ auth: context.auth, entitySet: context.propsValue.entityType }),
      isRepublish: context.isRepublish,
    });
  },
  async onDisable(context) {
    await dynamicsPolling.onDisable({ store: context.store });
  },
  async test(context) {
    return dynamicsPolling.test({
      client: makeClient(context.auth),
      config: await newRecordConfig({ auth: context.auth, entitySet: context.propsValue.entityType }),
    });
  },
  async run(context) {
    return dynamicsPolling.poll({
      client: makeClient(context.auth),
      store: context.store,
      config: await newRecordConfig({ auth: context.auth, entitySet: context.propsValue.entityType }),
    });
  },
});

async function newRecordConfig({ auth, entitySet }: { auth: DynamicsAuthValue; entitySet: string }): Promise<PollConfig> {
  const entity = await makeClient(auth).getEntityBySetName(entitySet);
  return { entitySet, primaryId: entity.PrimaryIdAttribute,
    outputKeys: outputKeys.record,
    addIdentity: true, column: 'createdon' };
}
