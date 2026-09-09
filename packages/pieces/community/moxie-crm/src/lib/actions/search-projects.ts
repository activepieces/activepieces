import { Property, createAction } from '@activepieces/pieces-framework';
import { makeClient } from '../common';
import { moxieCRMAuth } from '../auth';
import { searchProjectsActionOutputSchema } from '../output-schemas';

export const moxieSearchProjectsAction = createAction({
  auth: moxieCRMAuth,
  name: 'moxie_search_projects',
  classification: 'READ',
  displayName: 'Search Projects',
  description: 'Find projects belonging to a client.',
  audience: 'both',
  aiMetadata: {
    description:
      'Searches Moxie projects and returns the matches. Use to resolve a project name or id before creating a task or logging time against it. Read-only and idempotent.',
    idempotent: true,
  },
  outputSchema: searchProjectsActionOutputSchema,
  props: {
    query: Property.ShortText({
      displayName: 'Query',
      description: 'Client name whose projects should be returned.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const client = await makeClient(auth);
    return await client.searchProjects(propsValue.query);
  },
});
