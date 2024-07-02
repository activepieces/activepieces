import {
  PiecePropValueSchema,
  createAction,
} from '@activepieces/pieces-framework';
import { dynamicsCRMAuth } from '../../';
import { DynamicsCRMCommon, makeClient } from '../common';

export const getRecordAction = createAction({
  auth: dynamicsCRMAuth,
  name: 'dynamics_crm_get_record',
  displayName: 'Get Record',
  description: 'Retrieves an existing record.',
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
      context.auth as PiecePropValueSchema<typeof dynamicsCRMAuth>
    );

    return await client.getRecord(entityUrlPath, recordId);
  },
});
