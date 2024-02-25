import {
  PiecePropValueSchema,
  createAction,
} from '@activepieces/pieces-framework';
import { dynamicsCRMAuth } from '../../';
import { DynamicsCRMCommon, makeClient } from '../common';
import { EntityDetails } from '../common/constants';

export const updateRecordAction = createAction({
  auth: dynamicsCRMAuth,
  name: 'dynamics_crm_update_record',
  displayName: 'Update Record',
  description: 'Updates an existing record.',
  props: {
    entityType: DynamicsCRMCommon.entityType(
      'Select or map the entity for which you want to update the record.'
    ),
    recordId: DynamicsCRMCommon.recordId,
    fields: DynamicsCRMCommon.entityFields(false),
  },
  async run(context) {
    const { entityType, recordId, fields } = context.propsValue;

    const entityUrlPath = EntityDetails[entityType].urlPath;

    const client = makeClient(
      context.auth as PiecePropValueSchema<typeof dynamicsCRMAuth>
    );

    return await client.updatedRecord(entityUrlPath, recordId, fields);
  },
});
