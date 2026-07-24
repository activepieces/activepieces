import { createAction, Property } from '@activepieces/pieces-framework';
import { githubAuth } from '../../auth';
import { githubApiCall } from '../../common';
import { HttpMethod } from '@activepieces/pieces-common';
import { githubError } from './common';

export const githubCreateRepositoryAction = createAction({
  auth: githubAuth,
  name: 'create_repository',
  displayName: 'Create Repository (Agent)',
  description: 'Creates a new repository for the authenticated user.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Creates a new repository under the connected user account (POST /user/repos). Set private and auto_init (adds an initial README) as needed. For an org-owned repo use Create Organization Repository. Not idempotent: a second call with the same name returns 422 (name already exists).',
    idempotent: false,
  },
  props: {
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
    auto_init: Property.Checkbox({
      displayName: 'Auto Init',
      description:
        'Initialize with an empty README so the repo has a default branch.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const { name, description, auto_init } = propsValue;
    const body: Record<string, unknown> = { name };
    if (description !== undefined) body['description'] = description;
    if (propsValue.private !== undefined) body['private'] = propsValue.private;
    if (auto_init !== undefined) body['auto_init'] = auto_init;
    try {
      const response = await githubApiCall({
        auth,
        method: HttpMethod.POST,
        resourceUri: `/user/repos`,
        body,
      });
      return response.body;
    } catch (error: any) {
      throw githubError(error, `Repository "${name}"`);
    }
  },
});
