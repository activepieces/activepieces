import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { exaAuth } from '../../auth';
import { exaApi, exaInput } from '../../common/client';
import { AgentRunList, agentRuns } from '../../common/agent';
import { agentRunListOutputSchema } from '../../output-schemas';

export const listAgentRunsAction = createAction({
  name: 'exa_list_agent_runs',
  classification: 'SEARCH',
  displayName: 'List Agent Runs',
  description: 'Lists your team\'s Exa Agent runs, newest first, one page at a time.',
  audience: 'both',
  aiMetadata: {
    description:
      'Lists the team\'s Exa Agent runs newest first, returning id, status, query, effort and cost per run plus has_more and next_cursor for paging. Use to find an earlier run id when it was not kept; to read one run\'s full result use exa_get_agent_run. Returns one page only, so pass next_cursor as Cursor to continue. Read-only and idempotent.',
    idempotent: true,
  },
  auth: exaAuth,
  outputSchema: agentRunListOutputSchema,
  props: {
    limit: Property.Number({
      displayName: 'Limit',
      description: 'How many runs to return in this page, 1 to 100. Defaults to 20.',
      required: false,
      defaultValue: 20,
    }),
    cursor: Property.ShortText({
      displayName: 'Cursor',
      description: 'Leave empty for the first page. To get the next page, paste the Next Cursor value from the previous result.',
      required: false,
    }),
  },
  async run(context) {
    const limit = exaInput.optionalInteger({
      value: context.propsValue.limit,
      name: 'Limit',
      min: 1,
      max: 100,
    });
    const cursor = exaInput.optionalText(context.propsValue.cursor);
    const page = await exaApi.call<AgentRunList>({
      apiKey: context.auth.secret_text,
      method: HttpMethod.GET,
      path: '/agent/runs',
      query: {
        ...(limit !== undefined ? { limit: String(limit) } : {}),
        ...(cursor ? { cursor } : {}),
      },
    });
    const runs = (page.data ?? []).map((run) => agentRuns.summarizeRun(run));
    return {
      runs,
      count: runs.length,
      has_more: page.hasMore ?? false,
      next_cursor: page.nextCursor ?? null,
    };
  },
});
