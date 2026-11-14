import { createAction } from '@activepieces/pieces-framework';
import { dynamicsCRMAuth } from '../../auth';
import { makeClient } from '../../common/client';
import { odata } from '../../common/odata';
import { findAccountOutputSchema, outputKeys } from '../../common/output-schemas';
import { FIND_RESULT_LIMIT, salesEntities } from '../../common/sales-entities';

export const findAccountAction = createAction({
  auth: dynamicsCRMAuth,
  name: 'find_account',
  classification: 'SEARCH',
  displayName: 'Find Account',
  description: 'Finds accounts by name, account number or email. Returns the most recently modified match first.',
  audience: 'human',
  aiMetadata: {
    description:
      'Looks up Dynamics 365 accounts by name, account number or email (exact or contains). Read-only and safe to retry.',
    idempotent: true,
  },
  props: salesEntities.findProps(salesEntities.ACCOUNT),
  outputSchema: findAccountOutputSchema,
  async run(context) {
    const { searchBy, searchValue, match } = context.propsValue;
    const filter = salesEntities.findFilter({ entity: salesEntities.ACCOUNT, searchBy, value: searchValue, match });
    const page = await makeClient(context.auth).listRecords({
      entitySet: 'accounts',
      filter,
      orderby: 'modifiedon desc',
      pageSize: FIND_RESULT_LIMIT,
    });
    const records = page.records.map((record) => odata.shapeRecord({ record, keys: outputKeys.account }));
    return {
      found: records.length > 0,
      record: records[0] ?? null,
      records,
      hasMore: page.hasMore,
    };
  },
});
