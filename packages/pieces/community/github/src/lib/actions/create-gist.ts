import {
  createAction,
  MarkdownVariant,
  Property,
} from '@activepieces/pieces-framework';
import { githubAuth } from '../auth';
import { githubApiCall } from '../common';
import { GithubAuthValue, isAppAuth } from '../common/auth-helpers';
import { HttpMethod } from '@activepieces/pieces-common';
import { createGistActionOutputSchema } from '../output-schemas';

export const githubCreateGistAction = createAction({
  auth: githubAuth,
  name: 'github_create_gist',
  classification: 'WRITE',
  displayName: 'Create Gist',
  description: 'Creates a gist with one file.',
  audience: 'both',
  aiMetadata: {
    description:
      'Creates a GitHub Gist (a standalone code/text snippet) containing a single named file with the given content, public or secret. Use to share a snippet outside any repository. Requires an OAuth or personal access token connection — it throws an error under GitHub App authentication. Not idempotent: each call creates a new gist.',
    idempotent: false,
  },

  props: {
    appAuthNote: Property.MarkDown({
      value:
        'Gists need an OAuth or personal access token connection. GitHub App connections cannot create them.',
      variant: MarkdownVariant.INFO,
    }),

    description: Property.ShortText({
      displayName: 'Description',
      description: 'Shown above the file on the gist page.',
      required: false,
    }),

    public: Property.Checkbox({
      displayName: 'Public',
      description:
        'Turn off for a secret gist. Anyone with the link can still open it.',
      required: false,
      defaultValue: true,
    }),

    filename: Property.ShortText({
      displayName: 'Filename',
      description: 'Include the extension so GitHub highlights the code.',
      placeholder: 'notes.md',
      required: true,
    }),

    content: Property.LongText({
      displayName: 'File Content',
      required: true,
    }),
  },
  propertyGroups: [
    {
      key: 'file',
      display: 'section',
      label: 'File',
      icon: 'file',
      props: ['appAuthNote', 'filename', 'content'],
    },
    {
      key: 'gist',
      display: 'section',
      label: 'Gist',
      icon: 'sliders',
      props: ['description', 'public'],
    },
  ],

  outputSchema: createGistActionOutputSchema,
  async run({ auth, propsValue }) {
    if (isAppAuth(auth as GithubAuthValue)) {
      throw new Error(
        'Create Gist is not available with GitHub App authentication. The GitHub Gists API requires a user token — App installation tokens cannot create gists. Use an OAuth or personal access token connection instead.'
      );
    }

    const { description, public: isPublic, filename, content } = propsValue;

    const body = {
      description,
      public: isPublic ?? true,
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
