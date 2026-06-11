import {
  PiecePropValueSchema,
  createAction,
} from '@activepieces/pieces-framework';
import { dynamicsCRMAuth } from '../auth';
import { DynamicsCRMCommon, makeClient } from '../common';

export const getRecordAction = createAction({
  auth: dynamicsCRMAuth,
  name: 'dynamics_crm_get_record',
  displayName: 'Get Record',
  description: 'Retrieves an existing record.',
  audience: 'both',
  aiMetadata: {
    description:
      'Fetches a single record from a chosen Dynamics 365 / Dataverse entity type by its record ID (the entity primary-key GUID). Use to read a specific known record before updating, deleting, or referencing it. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    entityType: DynamicsCRMCommon.entityType(
      'Select or map the entity name whose records you want to retrieve.'
    ),
    recordId: DynamicsCRMCommon.recordId,
  },
  async run(context) {
    const { entityType, recordId } = context.propsValue;

    const entityUrlPath = entityType as string;

    const client = makeClient(
      context.auth
    );

    return await client.getRecord(entityUrlPath, recordId);
  },
});
