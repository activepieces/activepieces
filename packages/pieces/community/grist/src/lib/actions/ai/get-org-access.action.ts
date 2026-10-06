import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { commonProps } from '../../common/props';
import { gristAuth } from '../../auth';
import { GristAPIClient } from '../../common/helpers';
import { gristGetOrgAccessOutputSchema } from '../../output-schemas';

export const gristGetOrgAccessAction = createAction({
  auth: gristAuth,
  name: 'grist_get_org_access',
  outputSchema: gristGetOrgAccessOutputSchema,
  displayName: 'Get Org Access',
  description: 'Lists the users with access to an organization.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Returns the users of an organization with their emails and access roles (owner, editor, viewer). Use it to look up user IDs or check permissions.',
    idempotent: true,
  },
  props: { orgId: commonProps.org_id_text },
  async run(context) {
    const client = new GristAPIClient({
      domainUrl: context.auth.props.domain,
      apiKey: context.auth.props.apiKey,
    });
    return await client.makeRequest(
      HttpMethod.GET,
      `/orgs/${context.propsValue.orgId || 'current'}/access`,
      undefined,
      undefined
    );
  },
});
