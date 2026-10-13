import { Property, createAction } from '@activepieces/pieces-framework';
import { makeClient } from '../common';
import { moxieInput } from '../common/props';
import { moxieCRMAuth } from '../auth';
import { searchProjectsActionOutputSchema } from '../output-schemas';

export const moxieSearchProjectsAction = createAction({
  auth: moxieCRMAuth,
  name: 'moxie_search_projects',
  classification: 'SEARCH',
  displayName: 'Search Projects',
  description: "List a client's projects, look up one project by id, or list every project.",
  audience: 'both',
  aiMetadata: {
    description:
      'Returns the projects of the client whose exact name is given in Query (fails with a not-found error when no client has that name), the one project with an exact Project ID, or every project when both are empty. Use to resolve a project id or exact project name before creating tasks, logging time or invoicing. Read-only and idempotent.',
    idempotent: true,
  },
  outputSchema: searchProjectsActionOutputSchema,
  props: {
    query: Property.ShortText({
      displayName: 'Client Name',
      description: 'Exact client name whose projects should be returned. Leave empty to list all projects.',
      required: false,
    }),
    id: Property.ShortText({
      displayName: 'Project ID',
      description: 'Exact project id. When set, the client name is ignored.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const client = await makeClient(auth);
    return await client.searchProjects({
      query: moxieInput.text({ value: propsValue.query }),
      id: moxieInput.optionalId({ value: propsValue.id, field: 'Project ID' }),
    });
  },
});
