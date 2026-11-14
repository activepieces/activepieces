import { Property, TriggerStrategy, createTrigger } from '@activepieces/pieces-framework';
import { dynamicsCRMAuth } from '../auth';
import { DynamicsCRMCommon, makeClient } from '../common';
import { outputKeys, recordOutputSchema } from '../common/output-schemas';
import { PollConfig, dynamicsPolling } from '../common/polling';
import { DynamicsAuthValue } from '../common/types';

export const updatedRecordTrigger = createTrigger({
  auth: dynamicsCRMAuth,
  name: 'updated_record',
  classification: 'READ',
  displayName: 'Updated Record',
  description: 'Triggers when a record in the selected table is changed.',
  aiMetadata: {
    description:
      'Fires once per change of a record in the chosen Dynamics 365 table (by modifiedon); several changes between two polls fire once with the latest values. Newly created records are skipped unless included.',
  },
  props: {
    entityType: DynamicsCRMCommon.entityType('The table to watch for changed records.'),
    includeNewRecords: Property.Checkbox({
      displayName: 'Include New Records',
      description: 'Also fire for records that were created but not changed since.',
      required: false,
      defaultValue: false,
    }),
  },
  type: TriggerStrategy.POLLING,
  sampleData: {
    id: '6f3c6d2a-4b1e-ef11-8406-000d3a4f1234',
    entitySet: 'contacts',
    etag: 'W/"5123456"',
    contactid: '6f3c6d2a-4b1e-ef11-8406-000d3a4f1234',
    fullname: 'Jane Doe',
    emailaddress1: 'jane.doe@example.com',
    createdon: '2026-11-14T09:30:00Z',
    modifiedon: '2026-11-14T10:05:00Z',
    statecode: 0,
    statecode_formatted: 'Active',
  },
  outputSchema: recordOutputSchema,
  async onEnable(context) {
    await dynamicsPolling.onEnable({
      client: makeClient(context.auth),
      store: context.store,
      config: await updatedRecordConfig({ auth: context.auth, entitySet: context.propsValue.entityType, includeNew: context.propsValue.includeNewRecords }),
      isRepublish: context.isRepublish,
    });
  },
  async onDisable(context) {
    await dynamicsPolling.onDisable({ store: context.store });
  },
  async test(context) {
    return dynamicsPolling.test({
      client: makeClient(context.auth),
      config: await updatedRecordConfig({ auth: context.auth, entitySet: context.propsValue.entityType, includeNew: context.propsValue.includeNewRecords }),
    });
  },
  async run(context) {
    return dynamicsPolling.poll({
      client: makeClient(context.auth),
      store: context.store,
      config: await updatedRecordConfig({ auth: context.auth, entitySet: context.propsValue.entityType, includeNew: context.propsValue.includeNewRecords }),
    });
  },
});

async function updatedRecordConfig({ auth, entitySet, includeNew }: { auth: DynamicsAuthValue; entitySet: string; includeNew: boolean | undefined }): Promise<PollConfig> {
  const entity = await makeClient(auth).getEntityBySetName(entitySet);
  return {
    entitySet,
    primaryId: entity.PrimaryIdAttribute,
    outputKeys: outputKeys.record,
    addIdentity: true,
    column: 'modifiedon',
    include: includeNew === true ? undefined : dynamicsPolling.changedAfterCreate,
  };
}
