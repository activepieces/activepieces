import { Property, createAction } from '@activepieces/pieces-framework';
import { dynamicsCRMAuth } from '../auth';
import { DynamicsCRMCommon, dynamicsCommonInternals, makeClient } from '../common';
import { recordOutputSchema } from '../common/output-schemas';

export const getRecordAction = createAction({
  auth: dynamicsCRMAuth,
  name: 'dynamics_crm_get_record',
  classification: 'READ',
  displayName: 'Get Record',
  description: 'Retrieves an existing record.',
  audience: 'human',
  aiMetadata: {
    description:
      'Fetches a single record from a chosen Dynamics 365 / Dataverse entity type by its record ID. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    entityType: DynamicsCRMCommon.entityType(
      'The table of the record to retrieve.'
    ),
    recordId: DynamicsCRMCommon.recordId,
    includeFormattedValues: Property.Checkbox({
      displayName: 'Include Readable Values',
      description:
        'Also return display text as <column>_formatted fields, for example statuscode_formatted = "Active".',
      required: false,
      defaultValue: false,
      advanced: true,
    }),
  },
  outputSchema: recordOutputSchema,
  async run(context) {
    const { entityType, recordId, includeFormattedValues } = context.propsValue;
    const formatted = includeFormattedValues === true;
    const client = makeClient(context.auth);
    const record = await client.getRecord({ entitySet: entityType, recordId, formatted });
    return dynamicsCommonInternals.shapeGenericRecord({ client, entitySet: entityType, record });
  },
});
