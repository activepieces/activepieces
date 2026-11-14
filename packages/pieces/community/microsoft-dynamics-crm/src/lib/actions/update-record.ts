import { createAction } from '@activepieces/pieces-framework';
import { dynamicsCRMAuth } from '../auth';
import { DynamicsCRMCommon, dynamicsCommonInternals, makeClient } from '../common';
import { recordOutputSchema } from '../common/output-schemas';

export const updateRecordAction = createAction({
  auth: dynamicsCRMAuth,
  name: 'dynamics_crm_update_record',
  classification: 'WRITE',
  displayName: 'Update Record',
  description: 'Updates an existing record. Fails if the record does not exist.',
  audience: 'human',
  aiMetadata: {
    description:
      'Updates an existing record of a chosen Dynamics 365 / Dataverse entity type by its record ID. Fails with 404 instead of creating a record when the ID does not exist. Idempotent for the same values.',
    idempotent: true,
  },
  props: {
    entityType: DynamicsCRMCommon.entityType(
      'Select or map the entity for which you want to update the record.'
    ),
    recordId: DynamicsCRMCommon.recordId,
    fields: DynamicsCRMCommon.entityFields(false),
    additionalFields: DynamicsCRMCommon.additionalFields,
  },
  outputSchema: recordOutputSchema,
  async run(context) {
    const { entityType, recordId, fields, additionalFields } = context.propsValue;
    const client = makeClient(context.auth);
    const body = await dynamicsCommonInternals.normalizeDateOnlyFields({
      client,
      entitySet: entityType,
      body: dynamicsCommonInternals.buildRecordBody({ fields, additionalFields }),
    });
    if (Object.keys(body).length === 0) {
      throw new Error('Set at least one field to update.');
    }
    const record = await client.updateRecord({ entitySet: entityType, recordId, fields: body });
    return dynamicsCommonInternals.shapeGenericRecord({ client, entitySet: entityType, record });
  },
});
