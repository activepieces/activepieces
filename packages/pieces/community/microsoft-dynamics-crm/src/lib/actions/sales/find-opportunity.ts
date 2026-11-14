import { createAction } from '@activepieces/pieces-framework';
import { dynamicsCRMAuth } from '../../auth';
import { makeClient } from '../../common/client';
import { odata } from '../../common/odata';
import { findOpportunityOutputSchema, outputKeys } from '../../common/output-schemas';
import { FIND_RESULT_LIMIT, salesEntities } from '../../common/sales-entities';

export const findOpportunityAction = createAction({
  auth: dynamicsCRMAuth,
  name: 'find_opportunity',
  classification: 'SEARCH',
  displayName: 'Find Opportunity',
  description: 'Finds opportunities by topic. Returns the most recently modified match first.',
  audience: 'human',
  aiMetadata: {
    description:
      'Looks up Dynamics 365 opportunities by topic (exact or contains). Read-only and safe to retry.',
    idempotent: true,
  },
  props: salesEntities.findProps(salesEntities.OPPORTUNITY),
  outputSchema: findOpportunityOutputSchema,
  async run(context) {
    const { searchBy, searchValue, match } = context.propsValue;
    const filter = salesEntities.findFilter({ entity: salesEntities.OPPORTUNITY, searchBy, value: searchValue, match });
    const page = await makeClient(context.auth).listRecords({
      entitySet: 'opportunities',
      filter,
      orderby: 'modifiedon desc',
      pageSize: FIND_RESULT_LIMIT,
    });
    const records = page.records.map((record) => odata.shapeRecord({ record, keys: outputKeys.opportunity }));
    return {
      found: records.length > 0,
      record: records[0] ?? null,
      records,
      hasMore: page.hasMore,
    };
  },
});
