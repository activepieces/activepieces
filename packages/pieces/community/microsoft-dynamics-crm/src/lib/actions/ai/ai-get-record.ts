import { Property, createAction } from '@activepieces/pieces-framework';
import { dynamicsCRMAuth } from '../../auth';
import { makeClient } from '../../common/client';
import { dynamicsCommonInternals } from '../../common';
import { odata } from '../../common/odata';
import { recordOutputSchema } from '../../common/output-schemas';

export const aiGetRecordAction = createAction({
  auth: dynamicsCRMAuth,
  name: 'ai_get_record',
  classification: 'READ',
  displayName: 'Get Record',
  description: 'Gets one record by ID.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Reads one Dynamics 365 record by entitySet and GUID, including readable <column>_formatted values. Use Search Records when you do not have the ID. Read-only.',
    idempotent: true,
  },
  props: {
    entitySet: Property.ShortText({
      displayName: 'Entity Set',
      description: 'Entity set name (plural), for example contacts, accounts, leads or opportunities. Get it from List Entities.',
      required: true,
    }),
    recordId: Property.ShortText({
      displayName: 'Record ID',
      description: 'The record GUID. Get it from Search Records or a previous step.',
      required: true,
    }),
    select: Property.ShortText({
      displayName: 'Columns',
      description: 'Optional comma-separated column logical names to return.',
      required: false,
    }),
  },
  outputSchema: recordOutputSchema,
  async run(context) {
    const { entitySet, recordId, select } = context.propsValue;
    const client = makeClient(context.auth);
    const record = await client.getRecord({
      entitySet,
      recordId,
      select: odata.parseColumnList(select),
      formatted: true,
    });
    return dynamicsCommonInternals.shapeGenericRecord({ client, entitySet, record });
  },
});
