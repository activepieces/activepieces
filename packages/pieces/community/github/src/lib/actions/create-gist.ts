import { createAction, Property } from '@activepieces/pieces-framework';
import { githubAuth } from '../../';
import { githubApiCall } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';

export const githubCreateGistAction = createAction({
  auth: githubAuth,
  name: 'github_create_gist',
  displayName: 'Create Gist',
  description: 'Create a GitHub Gist',

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
    const { description, public: isPublic, filename, content } =
      propsValue;

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
      accessToken: auth.access_token,
      method: HttpMethod.POST,
      resourceUri: `/gists`,
      body,
    });

    return response;
  },
});
