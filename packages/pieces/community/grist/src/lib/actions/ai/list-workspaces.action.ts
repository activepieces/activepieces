import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { commonProps } from '../../common/props';
import { gristAuth } from '../../auth';
import { GristAPIClient } from '../../common/helpers';
import { gristListWorkspacesOutputSchema } from '../../output-schemas';

export const gristListWorkspacesAction = createAction({
  auth: gristAuth,
  name: 'grist_list_workspaces',
  outputSchema: gristListWorkspacesOutputSchema,
  displayName: 'List Workspaces',
  description: 'Lists the workspaces and documents of an organization.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Returns every workspace in an org together with the documents each contains. This is where workspace IDs (for **Create Document**) and document IDs (for every other action) come from.',
    idempotent: true,
  },
  props: { orgId: commonProps.org_id_text },
  async run(context) {
    const client = new GristAPIClient({
      domainUrl: context.auth.props.domain,
      apiKey: context.auth.props.apiKey,
    });
    const workspaces = await client.makeRequest<unknown[]>(
      HttpMethod.GET,
      `/orgs/${context.propsValue.orgId || 'current'}/workspaces`,
      undefined,
      undefined
    );
    return { workspaces, count: workspaces.length };
  },
});
