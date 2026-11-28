import { createAction } from '@activepieces/pieces-framework';
import { youtrackAuth } from '../auth';
import { issueDropdown } from '../common';
import { youtrackClient } from '../common/client';
import { getIssueLinksActionOutputSchema } from '../output-schemas';

export const getIssueLinksAction = createAction({
  auth: youtrackAuth,
  name: 'get_issue_links',
  classification: 'READ',
  outputSchema: getIssueLinksActionOutputSchema,
  displayName: 'Get Issue Links',
  description: 'Lists the issues linked to an issue, one row per linked issue.',
  audience: 'both',
  aiMetadata: {
    description:
      'Read the links of one issue: one row per linked issue with the link type, the relation phrase seen from this issue (e.g. "depends on", "subtask of"), and the linked issue\'s ID, readable ID, summary and resolved time. Use to check dependencies or subtasks; create links with Link Issues. Read-only and idempotent.',
    idempotent: true,
  },
  props: { issue: issueDropdown },
  async run(context) {
    const links = await youtrackClient.listAll({
      auth: context.auth,
      path: `/issues/${youtrackClient.segment({ value: context.propsValue.issue, label: 'Issue' })}/links`,
      query: { fields: 'id,direction,linkType(id,name,sourceToTarget,targetToSource,directed),issues(id,idReadable,summary,resolved)' },
      maxItems: 1000,
      operation: 'read the issue links',
    });
    const items = links.flatMap((link) => {
      const type = youtrackClient.recordOf(link['linkType']);
      const direction = youtrackClient.textOrNull(link['direction']);
      const relation = direction === 'INWARD' ? type['targetToSource'] : type['sourceToTarget'];
      return youtrackClient.records(link['issues']).map((issue) => ({
        link_type: youtrackClient.textOrNull(type['name']),
        direction,
        relation: youtrackClient.textOrNull(relation),
        issue_id: issue['id'] ?? null,
        issue_idReadable: issue['idReadable'] ?? null,
        issue_summary: issue['summary'] ?? null,
        issue_resolved: issue['resolved'] ?? null,
      }));
    });
    return { items };
  },
});
