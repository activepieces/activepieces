import { createAction } from '@activepieces/pieces-framework';
import { dynamicsCRMAuth } from '../auth';
import { DynamicsCRMCommon, dynamicsCommonInternals, makeClient } from '../common';
import { recordOutputSchema } from '../common/output-schemas';

export const createRecordAction = createAction({
  auth: dynamicsCRMAuth,
  name: 'dynamics_crm_create_record',
  classification: 'WRITE',
  displayName: 'Create Record',
  description: 'Creates a new record in any table.',
  audience: 'human',
  aiMetadata: {
    description:
      'Creates a new record of a chosen Dynamics 365 / Dataverse entity type from the picked field values. Not idempotent: each call inserts a new record.',
    idempotent: false,
  },
  props: {
    entityType: DynamicsCRMCommon.entityType(
      'The table to create the record in.'
    ),
    fields: DynamicsCRMCommon.entityFields(true),
    additionalFields: DynamicsCRMCommon.additionalFields,
  },
  outputSchema: recordOutputSchema,
  async run(context) {
    const { entityType, fields, additionalFields } = context.propsValue;
    const client = makeClient(context.auth);
    const body = await dynamicsCommonInternals.normalizeDateOnlyFields({
      client,
      entitySet: entityType,
      body: dynamicsCommonInternals.buildRecordBody({ fields, additionalFields }),
    });
    const record = await client.createRecord({ entitySet: entityType, fields: body });
    return dynamicsCommonInternals.shapeGenericRecord({ client, entitySet: entityType, record });
  },
});
