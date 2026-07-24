import { createAction, Property } from '@activepieces/pieces-framework';
import { githubAuth } from '../../auth';
import { githubApiCall } from '../../common';
import { HttpMethod } from '@activepieces/pieces-common';
import { githubError } from './common';

export const githubCreateOrganizationRepositoryAction = createAction({
  auth: githubAuth,
  name: 'create_organization_repository',
  displayName: 'Create Organization Repository (Agent)',
  description: 'Creates a new repository inside an organization.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Creates a new repository owned by an organization (POST /orgs/{org}/repos). Requires organization write permission. Not idempotent: a second call with the same name returns 422 (name already exists).',
    idempotent: false,
  },
  props: {
    org: Property.ShortText({
      displayName: 'Organization',
      description: 'The organization login that will own the repository.',
      required: true,
    }),
    name: Property.ShortText({
      displayName: 'Name',
      description: 'The repository name.',
      required: true,
    }),
    description: Property.ShortText({
      displayName: 'Description',
      required: false,
    }),
    private: Property.Checkbox({
      displayName: 'Private',
      description: 'Create as a private repository.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const { org, name, description } = propsValue;
    const body: Record<string, unknown> = { name };
    if (description !== undefined) body['description'] = description;
    if (propsValue.private !== undefined) body['private'] = propsValue.private;
    try {
      const response = await githubApiCall({
        auth,
        method: HttpMethod.POST,
        resourceUri: `/orgs/${org}/repos`,
        body,
      });
      return response.body;
    } catch (error: any) {
      throw githubError(error, `Organization "${org}"`);
    }
  },
});
