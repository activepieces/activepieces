import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { gristAuth } from '../../auth';
import { GristAPIClient } from '../../common/helpers';
import { gristListOrganizationsOutputSchema } from '../../output-schemas';

export const gristListOrganizationsAction = createAction({
  auth: gristAuth,
  name: 'grist_list_organizations',
  outputSchema: gristListOrganizationsOutputSchema,
  displayName: 'List Organizations',
  description: 'Lists the organizations you can access.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Returns the Grist orgs (team sites and personal areas) the API key can access, with their IDs and your access level.',
    idempotent: true,
  },
  props: {},
  async run(context) {
    const client = new GristAPIClient({
      domainUrl: context.auth.props.domain,
      apiKey: context.auth.props.apiKey,
    });
    const organizations = await client.makeRequest<unknown[]>(
      HttpMethod.GET,
      '/orgs',
      undefined,
      undefined
    );
    return { organizations, count: organizations.length };
  },
});
