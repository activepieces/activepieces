import {
  PiecePropValueSchema,
  createAction,
} from '@activepieces/pieces-framework';
import { dynamicsCRMAuth } from '../auth';
import { DynamicsCRMCommon, makeClient } from '../common';

export const updateRecordAction = createAction({
  auth: dynamicsCRMAuth,
  name: 'dynamics_crm_update_record',
  displayName: 'Update Record',
  description: 'Updates an existing record.',
  audience: 'both',
  aiMetadata: {
    description:
      'Updates an existing record of a chosen Dynamics 365 / Dataverse entity type, identified by its record ID (the entity primary-key GUID), applying the supplied field values. Use to modify a specific known record rather than create one. Idempotent: re-sending the same field values to the same ID leaves the record in the same final state.',
    idempotent: true,
  },
  props: {
    entityType: DynamicsCRMCommon.entityType(
      'Select or map the entity for which you want to update the record.'
    ),
    recordId: DynamicsCRMCommon.recordId,
    fields: DynamicsCRMCommon.entityFields(false),
  },
  async run(context) {
    const { entityType, recordId, fields } = context.propsValue;

    const entityUrlPath = entityType as string;

    const client = makeClient(
      context.auth
    );

    return await client.updatedRecord(entityUrlPath, recordId, fields);
  },
});
