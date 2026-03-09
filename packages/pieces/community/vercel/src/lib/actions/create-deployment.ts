import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { vercelAuth } from '../common/auth';
import { vercelApiCall } from '../common/client';
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
    target: deploymentTargetProperty,
    deployment_id: Property.ShortText({
      displayName: 'Existing Deployment ID',
      description: 'Deployment ID to redeploy.',
      required: false,
    }),
    with_latest_commit: Property.Checkbox({
      displayName: 'Use Latest Commit for Redeploy',
      description: 'Only applies when redeploying an existing deployment.',
      required: false,
      defaultValue: false,
    }),
    git_type: Property.StaticDropdown({
      displayName: 'Git Provider',
      description: 'Git provider used for the source deployment.',
      required: false,
      defaultValue: 'github',
      options: {
        options: [
          { label: 'GitHub', value: 'github' },
          { label: 'GitHub (Limited)', value: 'github-limited' },
          { label: 'GitLab', value: 'gitlab' },
          { label: 'Bitbucket', value: 'bitbucket' },
        ],
      },
    }),
    git_repo_org: Property.ShortText({
      displayName: 'Repository Organization / Workspace',
      description: 'For GitHub use the org/owner. For Bitbucket slug mode, use the owner.',
      required: false,
    }),
    git_repo_name: Property.ShortText({
      displayName: 'Repository Name / Slug',
      description: 'Repository name for GitHub or slug for Bitbucket slug mode.',
      required: false,
    }),
    git_branch: Property.ShortText({
      displayName: 'Git Branch / Ref',
      description: 'Branch or ref to deploy.',
      required: false,
    }),
    git_sha: Property.ShortText({
      displayName: 'Git Commit SHA',
      description: 'Optional commit SHA.',
      required: false,
    }),
    git_repo_id: Property.ShortText({
      displayName: 'Git Repository ID / Project ID',
      description: 'Use this for GitHub repoId or GitLab projectId mode.',
      required: false,
    }),
    git_repo_uuid: Property.ShortText({
      displayName: 'Bitbucket Repository UUID',
      description: 'Use this for Bitbucket UUID mode.',
      required: false,
    }),
    git_workspace_uuid: Property.ShortText({
      displayName: 'Bitbucket Workspace UUID',
      description: 'Optional Bitbucket workspace UUID.',
      required: false,
    }),
    force_new: Property.Checkbox({
      displayName: 'Force New Deployment',
      description: 'Create a new deployment even if a previous similar deployment exists.',
      required: false,
      defaultValue: false,
    }),
    skip_auto_detection_confirmation: Property.Checkbox({
      displayName: 'Skip Auto Detection Confirmation',
      description: 'Skips framework auto-detection confirmation when supported.',
      required: false,
      defaultValue: true,
    }),
  },
  async run(context) {
    const {
      project,
      deployment_source,
      target,
      deployment_id,
      with_latest_commit,
      git_type,
      git_repo_org,
      git_repo_name,
      git_branch,
      git_sha,
      git_repo_id,
      git_repo_uuid,
      git_workspace_uuid,
      force_new,
      skip_auto_detection_confirmation,
    } = context.propsValue;

    const body: Record<string, unknown> = {
      project: String(project),
      target: target ?? 'preview',
    };

    if (deployment_source === 'redeploy') {
      if (!deployment_id) {
        throw new Error('Existing Deployment ID is required when Deployment Source is Redeploy Existing Deployment.');
      }

      body['deploymentId'] = deployment_id;
      if (with_latest_commit) {
        body['withLatestCommit'] = true;
      }
    } else {
      if (!git_branch) {
        throw new Error('Git Branch / Ref is required when Deployment Source is Git Source.');
      }

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
