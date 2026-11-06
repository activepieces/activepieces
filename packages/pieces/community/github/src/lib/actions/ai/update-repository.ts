import { createAction, Property } from '@activepieces/pieces-framework';
import { githubAuth } from '../../auth';
import { githubApiCall } from '../../common';
import { HttpMethod } from '@activepieces/pieces-common';
import {
  ownerProp,
  repoProp,
  githubError,
  triStateProp,
  triStateValue,
} from './common';
import { repositoryBodyOutputSchema } from '../../output-schemas';

export const githubUpdateRepositoryAction = createAction({
  auth: githubAuth,
  name: 'update_repository',
  classification: 'WRITE',
  displayName: 'Update Repository (Agent)',
  description: 'Updates settings on a repository.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Updates a repository (PATCH /repos/{owner}/{repo}), setting only the fields you provide — name, description, private, default_branch, has_issues, or archived. private, has_issues and archived take yes, no or unchanged; leave them out or pass unchanged to keep the current visibility, Issues setting and archive state. Idempotent: applying the same values again leaves the repo in the same state. Archiving is reversible by setting archived to no.',
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
    private: triStateProp({
      displayName: 'Private',
      description: 'Yes makes the repository private, No makes it public.',
    }),
    default_branch: Property.ShortText({
      displayName: 'Default Branch',
      description: 'Resolve via List Branches.',
      required: false,
    }),
    has_issues: triStateProp({
      displayName: 'Has Issues',
      description: 'Yes turns Issues on, No turns them off.',
    }),
    archived: triStateProp({
      displayName: 'Archived',
      description:
        'Yes archives the repository (read-only state), No unarchives it.',
    }),
  },
  outputSchema: repositoryBodyOutputSchema,
  async run({ auth, propsValue }) {
    const { owner, repo } = propsValue;
    const isPrivate = triStateValue(propsValue.private);
    const hasIssues = triStateValue(propsValue.has_issues);
    const archived = triStateValue(propsValue.archived);
    const body: Record<string, unknown> = {};
    if (propsValue.name !== undefined) body['name'] = propsValue.name;
    if (propsValue.description !== undefined)
      body['description'] = propsValue.description;
    if (isPrivate !== undefined) body['private'] = isPrivate;
    if (propsValue.default_branch !== undefined)
      body['default_branch'] = propsValue.default_branch;
    if (hasIssues !== undefined) body['has_issues'] = hasIssues;
    if (archived !== undefined) body['archived'] = archived;
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
