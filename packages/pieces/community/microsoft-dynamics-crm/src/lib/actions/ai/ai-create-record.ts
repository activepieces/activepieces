import { Property, createAction } from '@activepieces/pieces-framework';
import { dynamicsCRMAuth } from '../../auth';
import { makeClient } from '../../common/client';
import { dynamicsCommonInternals } from '../../common';
import { odata } from '../../common/odata';
import { recordOutputSchema } from '../../common/output-schemas';

export const aiCreateRecordAction = createAction({
  auth: dynamicsCRMAuth,
  name: 'ai_create_record',
  classification: 'WRITE',
  displayName: 'Create Record',
  description: 'Creates a record in any table.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Creates a Dynamics 365 record (any table, including contacts, accounts, leads, opportunities) from a fields object; call Describe Entity first for column names and lookup bind keys. Not idempotent: each call creates a new record.',
    idempotent: false,
  },
  props: {
    entitySet: Property.ShortText({
      displayName: 'Entity Set',
      description: 'Entity set name (plural), for example contacts, accounts, leads or opportunities. Get it from List Entities.',
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
    const { entitySet, fields } = context.propsValue;
    const client = makeClient(context.auth);
    const body = await dynamicsCommonInternals.normalizeDateOnlyFields({
      client,
      entitySet,
      body: odata.compactFields(odata.parseJsonObject({ value: fields, label: 'Fields' })),
    });
    if (Object.keys(body).length === 0) {
      throw new Error('Fields must contain at least one column.');
    }
    const record = await client.createRecord({ entitySet, fields: body });
    return dynamicsCommonInternals.shapeGenericRecord({ client, entitySet, record });
  },
});
