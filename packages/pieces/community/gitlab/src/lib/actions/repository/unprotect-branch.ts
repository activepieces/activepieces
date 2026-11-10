import { createAction, Property } from '@activepieces/pieces-framework';
import { gitlabAuth } from '../../auth';
import { encodeSegment, gitlabRequest, projectPath } from '../../common/client';
import { GitlabApiError } from '../../common/secret-request';
import { gitlabProps, requireText } from '../../common/props';
import { unprotectedBranchOutputSchema } from '../../output-schemas';

export const unprotectBranchAction = createAction({
  auth: gitlabAuth,
  name: 'unprotect_branch',
  displayName: 'Unprotect Branch',
  description: 'Removes the protection from a branch or pattern.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description:
      'Removes branch protection from a GitLab branch name or wildcard, so anyone with Developer role can push, force-push or delete it. Requires Maintainer role. If the branch is not protected the call succeeds with alreadyUnprotected true.',
    idempotent: true,
  },
  props: {
    projectId: gitlabProps.projectId(),
    name: Property.ShortText({
      displayName: 'Branch or Pattern',
      description: 'Exactly as it was protected, e.g. release/*.',
      required: true,
    }),
  },
  outputSchema: unprotectedBranchOutputSchema,
  async run({ auth, propsValue }) {
    const name = requireText({
      value: propsValue.name,
      label: 'Branch or Pattern',
    });
    try {
      await gitlabRequest({
        auth,
        method: 'DELETE',
        path: `${projectPath(
          propsValue.projectId
        )}/protected_branches/${encodeSegment({
          value: name,
          label: 'Branch or Pattern',
        })}`,
      });
      return { unprotected: true, alreadyUnprotected: false, name };
    } catch (error) {
      if (error instanceof GitlabApiError && error.status === 404) {
        return { unprotected: true, alreadyUnprotected: true, name };
      }
      throw error;
    }
  },
});
