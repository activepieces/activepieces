import { createAction, Property } from '@activepieces/pieces-framework';
import { gitlabAuth } from '../../auth';
import { gitlabRequest, projectPath } from '../../common/client';
import { gitlabProps, requireText, triStateValue } from '../../common/props';
import { protectedBranchOutputSchema } from '../../output-schemas';

const accessLevel = (displayName: string) =>
  Property.StaticDropdown<number>({
    displayName,
    description: 'Leave empty for the GitLab default (Maintainers).',
    required: false,
    options: {
      options: [
        { label: 'No one', value: 0 },
        { label: 'Developers and Maintainers', value: 30 },
        { label: 'Maintainers', value: 40 },
      ],
    },
  });

export const protectBranchAction = createAction({
  auth: gitlabAuth,
  name: 'protect_branch',
  displayName: 'Protect Branch',
  description: 'Protects a branch or wildcard pattern.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Protects a GitLab branch name or wildcard (e.g. release/*) and sets who may push and merge. Requires Maintainer role. GitLab answers 409 if it is already protected, so a second call fails; undo with Unprotect Branch.',
    idempotent: false,
  },
  props: {
    projectId: gitlabProps.projectId(),
    name: Property.ShortText({
      displayName: 'Branch or Pattern',
      description: 'Branch name or wildcard such as release/*.',
      required: true,
    }),
    pushAccessLevel: accessLevel('Allowed to Push'),
    mergeAccessLevel: accessLevel('Allowed to Merge'),
    allowForcePush: gitlabProps.triState(
      'Allow Force Push',
      'Leave empty for the GitLab default (no).'
    ),
  },
  outputSchema: protectedBranchOutputSchema,
  async run({ auth, propsValue }) {
    return gitlabRequest({
      auth,
      method: 'POST',
      path: `${projectPath(propsValue.projectId)}/protected_branches`,
      body: {
        name: requireText({
          value: propsValue.name,
          label: 'Branch or Pattern',
        }),
        push_access_level: propsValue.pushAccessLevel ?? undefined,
        merge_access_level: propsValue.mergeAccessLevel ?? undefined,
        allow_force_push: triStateValue(propsValue.allowForcePush),
      },
      statusMessages: { 409: 'This branch or pattern is already protected' },
    });
  },
});
