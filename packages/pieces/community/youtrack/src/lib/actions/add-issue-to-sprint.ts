import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { youtrackAuth } from '../auth';
import { boardDropdown, issueDropdown, resolveIssue, sprintDropdown } from '../common';
import { youtrackClient } from '../common/client';
import { addIssueToSprintActionOutputSchema } from '../output-schemas';

export const addIssueToSprintAction = createAction({
  auth: youtrackAuth,
  name: 'add_issue_to_sprint',
  classification: 'WRITE',
  outputSchema: addIssueToSprintActionOutputSchema,
  displayName: 'Add Issue to Sprint',
  description: 'Adds an issue to a sprint of an agile board.',
  audience: 'both',
  aiMetadata: {
    description:
      'Add an issue (ID like "2-38" or "APT-5") to a sprint (board ID from List Agile Boards, sprint ID from List Sprints). Works on boards with manual and with automatic sprint assignment. Idempotent: adding an issue already in the sprint leaves it there.',
    idempotent: true,
  },
  props: {
    board: boardDropdown,
    sprint: sprintDropdown,
    issue: issueDropdown,
  },
  async run(context) {
    const board = youtrackClient.segment({ value: context.propsValue.board, label: 'Agile Board' });
    const sprint = youtrackClient.segment({ value: context.propsValue.sprint, label: 'Sprint' });
    const issue = await resolveIssue({ auth: context.auth, value: context.propsValue.issue });
    await youtrackClient.request<unknown>({
      auth: context.auth,
      method: HttpMethod.POST,
      path: `/agiles/${board}/sprints/${sprint}/issues`,
      query: { fields: 'id' },
      body: { id: issue.id, $type: 'Issue' },
      operation: 'add the issue to the sprint',
    });
    return {
      board_id: context.propsValue.board,
      sprint_id: context.propsValue.sprint,
      issue_id: issue.id,
      issue_idReadable: issue.idReadable,
      issue_summary: issue.summary,
    };
  },
});
