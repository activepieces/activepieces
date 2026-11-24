import { Property, createAction } from '@activepieces/pieces-framework';
import { dynamicsCRMAuth } from '../../auth';
import { makeClient } from '../../common/client';
import { dynamicsCommonInternals } from '../../common';
import { odata } from '../../common/odata';
import { recordOutputSchema } from '../../common/output-schemas';

export const aiUpdateRecordAction = createAction({
  auth: dynamicsCRMAuth,
  name: 'ai_update_record',
  classification: 'WRITE',
  displayName: 'Update Record',
  description: 'Updates an existing record.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Updates the given columns of an existing Dynamics 365 record by entitySet and GUID; other columns are unchanged and null clears a column. Fails with 404 rather than creating a record when the ID does not exist. Idempotent for the same values.',
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
    fields: Property.Json({
      displayName: 'Fields',
      description: 'Column values by logical name. Set lookups with "<navigationProperty>@odata.bind": "/<entitySet>(<id>)" from Describe Entity; option sets take the numeric value.',
      required: true,
    }),
  },
  outputSchema: recordOutputSchema,
  async run(context) {
    const { entitySet, recordId, fields } = context.propsValue;
    const client = makeClient(context.auth);
    const body = await dynamicsCommonInternals.normalizeDateOnlyFields({
      client,
      entitySet,
      body: odata.compactFields(odata.parseJsonObject({ value: fields, label: 'Fields' })),
    });
    if (Object.keys(body).length === 0) {
      throw new Error('Fields must contain at least one column.');
    }
    const record = await client.updateRecord({ entitySet, recordId, fields: body });
    return dynamicsCommonInternals.shapeGenericRecord({ client, entitySet, record });
  },
});
