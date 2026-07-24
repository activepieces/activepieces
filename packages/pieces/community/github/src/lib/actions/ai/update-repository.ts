import { createAction, Property } from '@activepieces/pieces-framework';
import { githubAuth } from '../../auth';
import { githubApiCall } from '../../common';
import { HttpMethod } from '@activepieces/pieces-common';
import { ownerProp, repoProp, githubError } from './common';

export const githubUpdateRepositoryAction = createAction({
  auth: githubAuth,
  name: 'update_repository',
  displayName: 'Update Repository (Agent)',
  description: 'Updates settings on a repository.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Updates a repository (PATCH /repos/{owner}/{repo}), setting only the fields you provide — name, description, private, default_branch, has_issues, or archived. Idempotent: applying the same values again leaves the repo in the same state. Archiving is reversible only via the GitHub UI/API by un-setting archived.',
    idempotent: true,
  },
  props: {
    owner: ownerProp,
    repo: repoProp,
    name: Property.ShortText({
      displayName: 'Name',
      required: false,
    }),
    description: Property.ShortText({
      displayName: 'Description',
      required: false,
    }),
    private: Property.Checkbox({
      displayName: 'Private',
      required: false,
    }),
    default_branch: Property.ShortText({
      displayName: 'Default Branch',
      description: 'Resolve via List Branches.',
      required: false,
    }),
    has_issues: Property.Checkbox({
      displayName: 'Has Issues',
      required: false,
    }),
    archived: Property.Checkbox({
      displayName: 'Archived',
      description: 'Set true to archive the repository (read-only state).',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const { owner, repo } = propsValue;
    const body: Record<string, unknown> = {};
    if (propsValue.name !== undefined) body['name'] = propsValue.name;
    if (propsValue.description !== undefined)
      body['description'] = propsValue.description;
    if (propsValue.private !== undefined) body['private'] = propsValue.private;
    if (propsValue.default_branch !== undefined)
      body['default_branch'] = propsValue.default_branch;
    if (propsValue.has_issues !== undefined)
      body['has_issues'] = propsValue.has_issues;
    if (propsValue.archived !== undefined)
      body['archived'] = propsValue.archived;
    try {
      const response = await githubApiCall({
        auth,
        method: HttpMethod.PATCH,
        resourceUri: `/repos/${owner}/${repo}`,
        body,
      });
      return response.body;
    } catch (error: any) {
      throw githubError(error, `Repository ${owner}/${repo}`);
    }
  },
});
