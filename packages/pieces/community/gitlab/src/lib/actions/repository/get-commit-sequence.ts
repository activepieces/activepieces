import { createAction } from '@activepieces/pieces-framework';
import { gitlabAuth } from '../../auth';
import { encodeSegment, gitlabRequest, projectPath } from '../../common/client';
import { gitlabProps, triStateValue } from '../../common/props';
import { commitSequenceOutputSchema } from '../../output-schemas';

export const getCommitSequenceAction = createAction({
  auth: gitlabAuth,
  name: 'get_commit_sequence',
  displayName: 'Get Commit Sequence Number',
  description: 'Gets how many commits lead up to a commit.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Returns the sequence number of a GitLab commit: the count of commits reachable from it, following first parents only when that option is set. Useful for build numbers.',
    idempotent: true,
  },
  props: {
    projectId: gitlabProps.projectId(),
    sha: gitlabProps.sha(),
    firstParent: gitlabProps.triState(
      'First Parent Only',
      'Count only first-parent commits.'
    ),
  },
  outputSchema: commitSequenceOutputSchema,
  async run({ auth, propsValue }) {
    return gitlabRequest({
      auth,
      method: 'GET',
      path: `${projectPath(
        propsValue.projectId
      )}/repository/commits/${encodeSegment({
        value: propsValue.sha,
        label: 'Commit SHA',
      })}/sequence`,
      query: { first_parent: triStateValue(propsValue.firstParent) },
    });
  },
});
