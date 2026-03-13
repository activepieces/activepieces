import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { vercelAuth } from '../common/auth';
import { listDeployments, vercelApiCall } from '../common/client';
import { vercelProjectDropdown } from '../common/props';

export const getDeploymentStatus = createAction({
  auth: vercelAuth,
  name: 'get_deployment_status',
  displayName: 'Get Deployment Status',
  description: 'Retrieve a deployment and inspect its current status.',
  props: {
    project: vercelProjectDropdown,
    deployment: Property.Dropdown({
      displayName: 'Deployment',
      description: 'Select the deployment to inspect.',
      required: true,
      auth: vercelAuth,
      refreshers: ['auth', 'project'],
      options: async ({ auth, project }) => {
        if (!auth || !project) {
          return { disabled: true, placeholder: 'Select a project first', options: [] };
        }
        const deployments = await listDeployments(auth, String(project));
        return {
          disabled: false,
          options: deployments.map((d) => ({
            label: d.url
              ? `${d.url} (${d.state ?? 'unknown'}${d.target ? ` · ${d.target}` : ''})`
              : d.name,
            value: d.uid,
          })),
        };
      },
    }),
    with_git_repo_info: Property.Checkbox({
      displayName: 'Include Git Repository Info',
      description: 'Adds gitRepo information when available.',
      required: false,
      defaultValue: true,
    }),
  },
  async run(context) {
    const { deployment, with_git_repo_info } = context.propsValue;

    return await vercelApiCall({
      method: HttpMethod.GET,
      path: `/v13/deployments/${encodeURIComponent(String(deployment))}`,
      auth: context.auth,
      query: {
        withGitRepoInfo: with_git_repo_info ? 'true' : undefined,
      },
    });
  },
});
