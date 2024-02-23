import {
  PiecePropValueSchema,
  createAction,
} from '@activepieces/pieces-framework';
import { dynamicsCRMAuth } from '../../';
import { DynamicsCRMCommon, makeClient } from '../common';
import { EntityDetails } from '../common/constants';

export const createRecordAction = createAction({
  auth: dynamicsCRMAuth,
  name: 'dynamics_crm_create_record',
  displayName: 'Create Record',
  description: 'Creates a new record.',
  props: {
    entityType: DynamicsCRMCommon.entityType(
      'Select or map the entity for which you want to create the record.'
    ),
    fields: DynamicsCRMCommon.entityFields(true),
  },
  async run(context) {
    const { entityType, fields } = context.propsValue;

    const entityUrlPath = EntityDetails[entityType].urlPath;

    const client = makeClient(
      context.auth as PiecePropValueSchema<typeof dynamicsCRMAuth>
    );

    return await client.createRecord(entityUrlPath, fields);
  },
});
