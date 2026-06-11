import { createAction, Property } from '@activepieces/pieces-framework';
import { capsuleCrmAuth } from '../common/auth';
import { capsuleCrmClient } from '../common/client';
import { Filter } from '../common/types';

export const findProjectAction = createAction({
  auth: capsuleCrmAuth,
  name: 'find_project',
  displayName: 'Find Project',
  description: 'Find a Project by search criteria.',
  audience: 'both',
  aiMetadata: {
    description:
      "Finds Capsule CRM projects (cases) matching a structured filter query (a conditions array of field/operator/value clauses, per Capsule's filter API). Use to locate projects by field criteria rather than a free-text term. Idempotent: it is a read-only filter that does not modify any data.",
    idempotent: true,
  },
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
    return await capsuleCrmClient.filterProjects(
      auth,
      propsValue.filter as unknown as Filter
    );
  },
});
