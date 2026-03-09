import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { vercelAuth } from '../common/auth';
import { vercelApiCall } from '../common/client';
import { envTargetsProperty, vercelProjectDropdown } from '../common/props';

export const upsertEnvironmentVariable = createAction({
  auth: vercelAuth,
  name: 'upsert_environment_variable',
  displayName: 'Upsert Environment Variable',
  description:
    'Create or update a Vercel environment variable using Vercel\'s upsert API.',
  props: {
    project: vercelProjectDropdown,
    key: Property.ShortText({
      displayName: 'Key',
      description: 'Environment variable key.',
      required: true,
    }),
    value: Property.LongText({
      displayName: 'Value',
      description: 'Environment variable value.',
      required: true,
    }),
    type: Property.StaticDropdown({
      displayName: 'Variable Type',
      description: 'Vercel environment variable type.',
      required: true,
      defaultValue: 'plain',
      options: {
        options: [
          { label: 'Plain', value: 'plain' },
          { label: 'Sensitive', value: 'sensitive' },
          { label: 'Encrypted', value: 'encrypted' },
        ],
      },
    }),
    target: envTargetsProperty,
    git_branch: Property.ShortText({
      displayName: 'Git Branch',
      description: 'Optional branch. Only valid when Preview is one of the selected targets.',
      required: false,
    }),
    comment: Property.ShortText({
      displayName: 'Comment',
      description: 'Optional note describing the variable usage.',
      required: false,
    }),
  },
  async run(context) {
    const { project, key, value, type, target, git_branch, comment } = context.propsValue;

    const targetValues = Array.isArray(target)
      ? target.map((entry) => String(entry))
      : [String(target)];

    if (git_branch && !targetValues.includes('preview')) {
      throw new Error('Git Branch can only be used when Preview is included in Target Environments.');
    }

    return await vercelApiCall({
      method: HttpMethod.POST,
      path: `/v10/projects/${encodeURIComponent(String(project))}/env`,
      auth: context.auth,
      query: {
        upsert: 'true',
      },
      body: {
        key,
        value,
        type,
        target: targetValues,
        ...(git_branch ? { gitBranch: git_branch } : {}),
        ...(comment ? { comment } : {}),
      },
    });
  },
});
