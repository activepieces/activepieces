import { createAction } from '@activepieces/pieces-framework';
import { gitlabAuth } from '../../auth';
import { encodeSegment, gitlabRequest, projectPath } from '../../common/client';
import { gitlabProps } from '../../common/props';
import { commitOutputSchema } from '../../output-schemas';

export const getCommitAction = createAction({
  auth: gitlabAuth,
  name: 'get_commit',
  displayName: 'Get Commit',
  description: 'Gets one commit by SHA, branch or tag.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Returns one GitLab commit (message, author, dates, parent SHAs, line stats, web URL) by SHA or by a branch or tag name, which resolves to its latest commit.',
    idempotent: true,
  },
  props: {
    projectId: gitlabProps.projectId(),
    sha: gitlabProps.sha(),
  },
  outputSchema: commitOutputSchema,
  async run({ auth, propsValue }) {
    return gitlabRequest({
      auth,
      method: 'GET',
      path: `${projectPath(
        propsValue.projectId
      )}/repository/commits/${encodeSegment({
        value: propsValue.sha,
        label: 'Commit SHA',
      })}`,
      query: { stats: true },
    });
  },
});
