import { createAction, Property } from '@activepieces/pieces-framework';
import { capsuleCrmAuth } from '../common/auth';
import { capsuleCrmClient } from '../common/client';
import { opportunityListOutputSchema } from '../common/output-schemas';

export const findOpportunityAction = createAction({
  auth: capsuleCrmAuth,
  name: 'find_opportunity',
  classification: 'SEARCH',
  displayName: 'Find Opportunity',
  description: 'Find an Opportunity by search criteria. Returns up to 1,000 matches (10 pages); narrow the search if you need more.',
  audience: 'human',
  aiMetadata: {
    description:
      "Finds Capsule CRM opportunities matching a structured filter query (a conditions array of field/operator/value clauses, per Capsule's filter API). Use to locate opportunities by field criteria rather than a free-text term. Idempotent: it is a read-only filter that does not modify any data.",
    idempotent: true,
  },
  outputSchema: opportunityListOutputSchema,
  props: {
    filter: Property.Json({
      displayName: 'Filter',
      description:
        'The structured filter query. See the [documentation](https://capsulecrm.com/developer/api-v2/filters/) for examples.',
      required: true,
      defaultValue: {
        conditions: [
          {
            field: 'name',
            operator: 'is',
            value: 'example',
          },
        ],
      },
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;
    return await capsuleCrmClient.filterOpportunities({ auth, filter: capsuleCrmClient.toFilter(propsValue.filter) });
  },
});
