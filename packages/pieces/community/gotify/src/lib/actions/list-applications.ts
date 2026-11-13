import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { gotifyAuth } from '../auth';
import { gotifyClient } from '../common/client';
import { gotifyOutputSchemas } from '../common/output-schemas';

export const listApplications = createAction({
  auth: gotifyAuth,
  name: 'list_applications',
  classification: 'SEARCH',
  displayName: 'List Applications',
  description: 'List the applications of the connected Gotify user.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists every Gotify application of the connected user (id, name, description, defaultPriority, lastUsed). App tokens are not returned. Needs the Client Token. Read-only.',
    idempotent: true,
  },
  outputSchema: gotifyOutputSchemas.listApplications,
  props: {},
  async run({ auth }) {
    const body = await gotifyClient.request({ auth: auth.props, method: HttpMethod.GET, path: '/application', tokenKind: 'client' });
    const applications = gotifyClient.arrayOf(body).map((app) => gotifyClient.withoutToken(app));
    return { applications, count: applications.length };
  },
});
