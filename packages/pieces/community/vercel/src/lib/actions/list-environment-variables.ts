import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { vercelAuth } from '../common/auth';
import { vercelApiCall } from '../common/client';
import { vercelProjectDropdown } from '../common/props';

export const listEnvironmentVariables = createAction({
  auth: vercelAuth,
  name: 'list_environment_variables',
  displayName: 'List Environment Variables',
  description: 'Retrieve environment variables for a Vercel project.',
  props: {
    project: vercelProjectDropdown,
    decrypt: Property.Checkbox({
      displayName: 'Decrypt Values',
      description: 'Deprecated by Vercel. If enabled, Vercel will attempt to return decrypted values when allowed.',
      required: false,
      defaultValue: false,
    }),
    git_branch: Property.ShortText({
      displayName: 'Git Branch',
      description: 'Optional branch filter. Only valid for preview-scoped variables.',
      required: false,
    }),
  },
  async run(context) {
    const { project, decrypt, git_branch } = context.propsValue;

    return await vercelApiCall({
      method: HttpMethod.GET,
      path: `/v10/projects/${encodeURIComponent(String(project))}/env`,
      auth: context.auth,
      query: {
        decrypt: decrypt ? 'true' : undefined,
        gitBranch: git_branch,
      },
    });
  },
});
