import {
  PiecePropValueSchema,
  createAction,
} from '@activepieces/pieces-framework';
import { dynamicsCRMAuth } from '../auth';
import { DynamicsCRMCommon, makeClient } from '../common';

export const deleteRecordAction = createAction({
  auth: dynamicsCRMAuth,
  name: 'dynamics_crm_delete_record',
  displayName: 'Delete Record',
  description: 'Deletes an existing record.',
  audience: 'both',
  aiMetadata: {
    description:
      'Permanently deletes a single record from a chosen Dynamics 365 / Dataverse entity type, identified by its record ID (the entity primary-key GUID). Use when an agent must remove a specific known record. Destructive and not idempotent: the first call removes the record and subsequent calls for the same ID fail since it no longer exists.',
    idempotent: false,
  },
  props: {
    entityType: DynamicsCRMCommon.entityType(
      'Select or map the entity name whose records you want to delete.'
    ),
    recordId: DynamicsCRMCommon.recordId,
  },
  async run(context) {
    const { entityType, recordId } = context.propsValue;

    const entityUrlPath = entityType as string;

    const client = makeClient(
      context.auth
    );

    return await client.deleteRecord(entityUrlPath, recordId);
  },
});
