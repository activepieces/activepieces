import { createAction } from '@activepieces/pieces-framework';
import { dynamicsCRMAuth } from '../../auth';
import { makeClient } from '../../common/client';
import { odata } from '../../common/odata';
import { findContactOutputSchema, outputKeys } from '../../common/output-schemas';
import { FIND_RESULT_LIMIT, salesEntities } from '../../common/sales-entities';

export const findContactAction = createAction({
  auth: dynamicsCRMAuth,
  name: 'find_contact',
  classification: 'SEARCH',
  displayName: 'Find Contact',
  description: 'Finds contacts by email address, name or phone. Returns the most recently modified match first.',
  audience: 'human',
  aiMetadata: {
    description:
      'Looks up Dynamics 365 contacts by email address, name or phone (exact or contains). Read-only and safe to retry.',
    idempotent: true,
  },
  props: salesEntities.findProps(salesEntities.CONTACT),
  outputSchema: findContactOutputSchema,
  async run(context) {
    const { searchBy, searchValue, match } = context.propsValue;
    const filter = salesEntities.findFilter({ entity: salesEntities.CONTACT, searchBy, value: searchValue, match });
    const page = await makeClient(context.auth).listRecords({
      entitySet: 'contacts',
      filter,
      orderby: 'modifiedon desc',
      pageSize: FIND_RESULT_LIMIT,
    });
    const records = page.records.map((record) => odata.shapeRecord({ record, keys: outputKeys.contact }));
    return {
      found: records.length > 0,
      record: records[0] ?? null,
      records,
      hasMore: page.hasMore,
    };
  },
});
