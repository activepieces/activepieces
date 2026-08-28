import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { jiraCloudAuth } from '../../auth';
import { jiraApiCall } from '../common';
import { listIssueTransitionsOutputSchema } from '../output-schemas';

/** One transition as returned by `GET /issue/{issueIdOrKey}/transitions`. */
type JiraTransition = {
  id: string;
  name: string;
  isAvailable?: boolean;
  hasScreen?: boolean;
  to?: {
    id?: string;
    name?: string;
    statusCategory?: { key?: string };
  };
};

/** Jira wraps the array in an envelope — this action never returns it raw. */
type JiraTransitionsResponse = {
  expand?: string;
  transitions?: JiraTransition[];
};

/**
 * Agent atomic: the id-resolution step that Transition Issue is missing.
 *
 * Transition Issue takes `transitionId` from `issueStatusIdProp`, a
 * `Property.Dropdown` whose options resolver is the only code path in this piece
 * that calls the transitions endpoint. Dropdown resolvers run in the flow builder,
 * so an agent driving the piece over MCP has no way to obtain a transition id —
 * and unlike a project or account id, it cannot be looked up anywhere else either,
 * because transition ids are per-issue AND per-workflow-state.
 */
export const listIssueTransitionsAction = createAction({
  auth: jiraCloudAuth,
  name: 'list_issue_transitions',
  // READ, not SEARCH. The split is how data is addressed (by id vs by query), and
  // the shipped gmail atomics draw exactly that line: gmail_get_thread is READ with
  // a required id even though it returns a collection, while gmail_list_drafts is
  // SEARCH because it takes no required id. This takes a required issueIdOrKey.
  classification: 'READ',
  displayName: 'List Issue Transitions',
  description:
    'Lists the workflow transitions currently available for a specific issue.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Resolves the workflow moves a specific Jira issue can make from its current status, together with the transition id each one requires; by default only transitions the caller may execute are returned, with an option to include blocked ones for diagnosis. Call it before Transition Issue, whose transition id is per-issue and workflow-state-dependent and so cannot be guessed, looked up elsewhere, or reused across issues. Read-only and idempotent.',
    idempotent: true,
  },
  outputSchema: listIssueTransitionsOutputSchema,
  props: {
    issueIdOrKey: Property.ShortText({
      displayName: 'Issue ID or Key',
      description:
        'The issue to list transitions for (e.g. "PROJ-123"). Obtain from Search Issues or Get Issue.',
      required: true,
    }),
    includeUnavailableTransitions: Property.Checkbox({
      displayName: 'Include Unavailable Transitions',
      description:
        'When enabled, also returns transitions the current user cannot execute (e.g. blocked by a workflow condition or permission). Useful for diagnosing why an expected status is unreachable.',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const { issueIdOrKey, includeUnavailableTransitions } = context.propsValue;

    const response = await jiraApiCall<JiraTransitionsResponse>({
      auth: context.auth,
      method: HttpMethod.GET,
      resourceUri: `/issue/${issueIdOrKey}/transitions`,
      query: includeUnavailableTransitions
        ? { includeUnavailableTransitions: 'true' }
        : undefined,
    });

    // Flatten each transition's nested `to.statusCategory` so the output is
    // table-ready, and never return Jira's { expand, transitions } envelope.
    const transitions = (response.transitions ?? []).map((transition) => ({
      id: transition.id,
      name: transition.name,
      toStatusId: transition.to?.id ?? null,
      toStatusName: transition.to?.name ?? null,
      toStatusCategory: transition.to?.statusCategory?.key ?? null,
      isAvailable: transition.isAvailable ?? true,
      hasScreen: transition.hasScreen ?? false,
    }));

    return {
      issueIdOrKey,
      count: transitions.length,
      transitions,
    };
  },
});
