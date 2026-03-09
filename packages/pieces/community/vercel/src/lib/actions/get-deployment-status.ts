import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { vercelAuth } from '../common/auth';
import { vercelApiCall } from '../common/client';

export const getDeploymentStatus = createAction({
  auth: vercelAuth,
  name: 'get_deployment_status',
  displayName: 'Get Deployment Status',
  description: 'Retrieve a deployment by ID or URL and inspect its current status.',
  props: {
    id_or_url: Property.ShortText({
      displayName: 'Deployment ID or URL',
      description: 'Deployment ID (for example dpl_xxx) or deployment hostname.',
      required: true,
    }),
    with_git_repo_info: Property.Checkbox({
      displayName: 'Include Git Repository Info',
      description: 'Adds gitRepo information when available.',
      required: false,
      defaultValue: true,
    }),
  },
  async run(context) {
    const { id_or_url, with_git_repo_info } = context.propsValue;

    return await vercelApiCall({
      method: HttpMethod.GET,
      path: `/v13/deployments/${encodeURIComponent(String(id_or_url))}`,
      auth: context.auth,
      query: {
        withGitRepoInfo: with_git_repo_info ? 'true' : undefined,
      },
    });
  },
});
