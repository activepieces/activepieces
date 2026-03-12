import { createAction, DynamicPropsValue, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { vercelAuth, VercelAuthValue } from '../common/auth';
import { listDeployments, vercelApiCall } from '../common/client';
import { deploymentTargetProperty, vercelProjectDropdown } from '../common/props';

export const createDeployment = createAction({
  auth: vercelAuth,
  name: 'create_deployment',
  displayName: 'Create Deployment',
  description:
    'Create a deployment for an existing Vercel project using either a redeploy source deployment ID or a git source payload.',
  props: {
    project: vercelProjectDropdown,
    deployment_source: Property.StaticDropdown({
      displayName: 'Deployment Source',
      description: 'Choose whether to redeploy a previous deployment or deploy from a connected Git source.',
      required: true,
      defaultValue: 'redeploy',
      options: {
        options: [
          { label: 'Redeploy Existing Deployment', value: 'redeploy' },
          { label: 'Git Source', value: 'git_source' },
        ],
      },
    }),
    source_fields: Property.DynamicProperties({
      displayName: 'Source Configuration',
      required: false,
      auth: vercelAuth,
      refreshers: ['deployment_source', 'project'],
      props: async ({ auth, deployment_source, project }) => {
        const fields: DynamicPropsValue = {};

        if (deployment_source === 'redeploy') {
          fields['deployment_id'] = Property.Dropdown({
            displayName: 'Deployment',
            description: 'Select the deployment to redeploy.',
            required: true,
            auth: vercelAuth,
            refreshers: ['auth', 'project'],
            options: async () => {
              if (!auth || !project) {
                return { disabled: true, placeholder: 'Select a project first', options: [] };
              }
              const deployments = await listDeployments(auth as VercelAuthValue, String(project));
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
          });
          fields['with_latest_commit'] = Property.Checkbox({
            displayName: 'Use Latest Commit for Redeploy',
            description: 'When enabled, redeploys using the latest commit instead of the original deployment files.',
            required: false,
            defaultValue: false,
          });
          return fields;
        }

        fields['target'] = deploymentTargetProperty;
        fields['git_type'] = Property.StaticDropdown({
          displayName: 'Git Provider',
          description: 'Git provider used for the source deployment.',
          required: true,
          defaultValue: 'github',
          options: {
            options: [
              { label: 'GitHub', value: 'github' },
              { label: 'GitHub (Limited)', value: 'github-limited' },
              { label: 'GitLab', value: 'gitlab' },
              { label: 'Bitbucket', value: 'bitbucket' },
            ],
          },
        });
        fields['git_repo_org'] = Property.ShortText({
          displayName: 'Repository Organization / Workspace',
          description: 'For GitHub use the org/owner. For Bitbucket slug mode, use the owner.',
          required: false,
        });
        fields['git_repo_name'] = Property.ShortText({
          displayName: 'Repository Name / Slug',
          description: 'Repository name for GitHub or slug for Bitbucket slug mode.',
          required: false,
        });
        fields['git_branch'] = Property.ShortText({
          displayName: 'Git Branch / Ref',
          description: 'Branch or ref to deploy.',
          required: true,
        });
        fields['git_sha'] = Property.ShortText({
          displayName: 'Git Commit SHA',
          description: 'Optional commit SHA.',
          required: false,
        });
        fields['git_repo_id'] = Property.ShortText({
          displayName: 'Git Repository ID / Project ID',
          description: 'Use this for GitHub repoId or GitLab projectId mode.',
          required: false,
        });
        fields['git_repo_uuid'] = Property.ShortText({
          displayName: 'Bitbucket Repository UUID',
          description: 'Use this for Bitbucket UUID mode.',
          required: false,
        });
        fields['git_workspace_uuid'] = Property.ShortText({
          displayName: 'Bitbucket Workspace UUID',
          description: 'Optional Bitbucket workspace UUID.',
          required: false,
        });
        return fields;
      },
    }),
    force_new: Property.Checkbox({
      displayName: 'Force New Deployment',
      description: 'Create a new deployment even if a previous similar deployment exists.',
      required: false,
      defaultValue: false,
    }),
    skip_auto_detection_confirmation: Property.Checkbox({
      displayName: 'Skip Auto Detection Confirmation',
      description: 'Automatically confirm framework detection without prompting.',
      required: false,
      defaultValue: true,
    }),
  },
  async run(context) {
    const {
      project,
      deployment_source,
      source_fields,
      force_new,
      skip_auto_detection_confirmation,
    } = context.propsValue;

    const deployment_id = source_fields?.['deployment_id'];
    const with_latest_commit = source_fields?.['with_latest_commit'];
    const target = source_fields?.['target'];
    const git_type = source_fields?.['git_type'];
    const git_repo_org = source_fields?.['git_repo_org'];
    const git_repo_name = source_fields?.['git_repo_name'];
    const git_branch = source_fields?.['git_branch'];
    const git_sha = source_fields?.['git_sha'];
    const git_repo_id = source_fields?.['git_repo_id'];
    const git_repo_uuid = source_fields?.['git_repo_uuid'];
    const git_workspace_uuid = source_fields?.['git_workspace_uuid'];

    const projectId = String(project);
    const body: Record<string, unknown> = {
      name: projectId,
      project: projectId,
    };

    if (deployment_source === 'redeploy') {
      if (!deployment_id) {
        throw new Error('Please select a deployment to redeploy.');
      }

      body['deploymentId'] = deployment_id;
      if (with_latest_commit) {
        body['withLatestCommit'] = true;
      }
    } else {
      if (!git_branch) {
        throw new Error('Git Branch / Ref is required when Deployment Source is Git Source.');
      }

      body['target'] = target ?? 'preview';

      if (git_type === 'github' || git_type === 'github-limited') {
        if (git_repo_id) {
          body['gitSource'] = {
            type: git_type,
            ref: git_branch,
            repoId: git_repo_id,
            ...(git_sha ? { sha: git_sha } : {}),
          };
        } else if (git_repo_org && git_repo_name) {
          body['gitSource'] = {
            type: git_type,
            ref: git_branch,
            org: git_repo_org,
            repo: git_repo_name,
            ...(git_sha ? { sha: git_sha } : {}),
          };
        } else {
          throw new Error('For GitHub deployments, provide either Repository ID or both Repository Organization and Repository Name.');
        }
      } else if (git_type === 'gitlab') {
        if (!git_repo_id) {
          throw new Error('Git Repository ID / Project ID is required for GitLab deployments.');
        }
        body['gitSource'] = {
          type: 'gitlab',
          ref: git_branch,
          projectId: git_repo_id,
          ...(git_sha ? { sha: git_sha } : {}),
        };
      } else if (git_type === 'bitbucket') {
        if (git_repo_uuid) {
          body['gitSource'] = {
            type: 'bitbucket',
            ref: git_branch,
            repoUuid: git_repo_uuid,
            ...(git_workspace_uuid ? { workspaceUuid: git_workspace_uuid } : {}),
            ...(git_sha ? { sha: git_sha } : {}),
          };
        } else if (git_repo_org && git_repo_name) {
          body['gitSource'] = {
            type: 'bitbucket',
            ref: git_branch,
            owner: git_repo_org,
            slug: git_repo_name,
            ...(git_sha ? { sha: git_sha } : {}),
          };
        } else {
          throw new Error('For Bitbucket deployments, provide either Repository UUID or both Organization / Workspace and Repository Name / Slug.');
        }
      } else {
        throw new Error(`Unsupported Git Provider: ${String(git_type)}. Please select a valid provider.`);
      }
    }

    return await vercelApiCall({
      method: HttpMethod.POST,
      path: '/v13/deployments',
      auth: context.auth,
      query: {
        forceNew: force_new ? 1 : undefined,
        skipAutoDetectionConfirmation: skip_auto_detection_confirmation ? 1 : undefined,
      },
      body,
    });
  },
});
