import {
  PiecePropValueSchema,
  createAction,
} from '@activepieces/pieces-framework';
import { dynamicsCRMAuth } from '../auth';
import { DynamicsCRMCommon, makeClient } from '../common';

export const createRecordAction = createAction({
  auth: dynamicsCRMAuth,
  name: 'dynamics_crm_create_record',
  displayName: 'Create Record',
  description: 'Creates a new record.',
  audience: 'both',
  aiMetadata: {
    description:
      'Creates a new record of a chosen Dynamics 365 / Dataverse entity type (e.g. accounts, contacts, leads), passing the field values for that entity. Pick the entity from its discovered entity-set name or map a raw entity-set name. Not idempotent: each call inserts a new record, so repeated calls create duplicates.',
    idempotent: false,
  },
  props: {
    entityType: DynamicsCRMCommon.entityType(
      'Select or map the entity for which you want to create the record.'
    ),
    fields: DynamicsCRMCommon.entityFields(true),
  },
  async run(context) {
    const { entityType, fields } = context.propsValue;

    const entityUrlPath = entityType as string;

    const client = makeClient(
      context.auth
    );

    return await client.createRecord(entityUrlPath, fields);
  },
});
