import { createAction, Property } from '@activepieces/pieces-framework';
import { githubAuth } from '../auth';
import { githubApiCall } from '../common';
import { GithubAuthValue, isAppAuth } from '../common/auth-helpers';
import { HttpMethod } from '@activepieces/pieces-common';

export const githubCreateGistAction = createAction({
  auth: githubAuth,
  name: 'github_create_gist',
  displayName: 'Create Gist',
  description:
    'Create a GitHub Gist. Requires an OAuth connection — Gists cannot be created with GitHub App authentication.',

  props: {
    description: Property.ShortText({
      displayName: 'Description',
      description: 'Description of the gist',
      required: false,
    }),

    public: Property.Checkbox({
      displayName: 'Public',
      description: 'Whether the gist should be public',
      required: true,
      defaultValue: true,
    }),

    filename: Property.ShortText({
      displayName: 'Filename',
      description: 'Name of the file in the gist',
      required: true,
    }),

    content: Property.LongText({
      displayName: 'File Content',
      description: 'Content of the file',
      required: true,
    }),
  },

  async run({ auth, propsValue }) {
    if (isAppAuth(auth as GithubAuthValue)) {
      throw new Error(
        'Create Gist is not available with GitHub App authentication. The GitHub Gists API requires a user OAuth token — App installation tokens cannot create gists. Use an OAuth connection instead.'
      );
    }

    const { description, public: isPublic, filename, content } = propsValue;

    const body = {
      description,
      public: isPublic,
      files: {
        [filename]: {
          content,
        },
      },
    };

    const response = await githubApiCall({
      auth,
      method: HttpMethod.POST,
      resourceUri: `/gists`,
      body,
    });

    return response;
  },
});
