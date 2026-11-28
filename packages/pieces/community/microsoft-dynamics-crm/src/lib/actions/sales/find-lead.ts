import { createAction } from '@activepieces/pieces-framework';
import { dynamicsCRMAuth } from '../../auth';
import { makeClient } from '../../common/client';
import { odata } from '../../common/odata';
import { findLeadOutputSchema, outputKeys } from '../../common/output-schemas';
import { FIND_RESULT_LIMIT, salesEntities } from '../../common/sales-entities';

export const findLeadAction = createAction({
  auth: dynamicsCRMAuth,
  name: 'find_lead',
  classification: 'SEARCH',
  displayName: 'Find Lead',
  description: 'Finds leads by email, name, company or topic. Returns the most recently modified match first.',
  audience: 'human',
  aiMetadata: {
    description:
      'Looks up Dynamics 365 leads by email, name, company or topic (exact or contains). Read-only and safe to retry.',
    idempotent: true,
  },
  props: salesEntities.findProps(salesEntities.LEAD),
  outputSchema: findLeadOutputSchema,
  async run(context) {
    const { searchBy, searchValue, match } = context.propsValue;
    const filter = salesEntities.findFilter({ entity: salesEntities.LEAD, searchBy, value: searchValue, match });
    const page = await makeClient(context.auth).listRecords({
      entitySet: 'leads',
      filter,
      orderby: 'modifiedon desc',
      pageSize: FIND_RESULT_LIMIT,
    });
    const records = page.records.map((record) => odata.shapeRecord({ record, keys: outputKeys.lead }));
    return {
      found: records.length > 0,
      record: records[0] ?? null,
      records,
      hasMore: page.hasMore,
    };
  },
});
