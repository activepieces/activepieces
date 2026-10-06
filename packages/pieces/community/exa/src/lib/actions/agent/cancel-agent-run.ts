import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { exaAuth } from '../../auth';
import { exaApi, exaInput } from '../../common/client';
import { AgentRun, agentRuns } from '../../common/agent';
import { agentRunOutputSchema } from '../../output-schemas';

export const cancelAgentRunAction = createAction({
  name: 'exa_cancel_agent_run',
  classification: 'DESTRUCTIVE',
  displayName: 'Cancel Agent Run',
  description:
    'Cancels a queued or running Exa Agent run right away. The run returns no results, and usage so far is still billed.',
  audience: 'both',
  aiMetadata: {
    description:
      'Cancels a queued or running Exa Agent run immediately, discarding its results; usage accrued before the cancel is still billed. Use to stop spend on a run that is no longer needed; to read a finished run use exa_get_agent_run instead. Safe to retry: a run that already finished is returned unchanged.',
    idempotent: true,
  },
  auth: exaAuth,
  outputSchema: agentRunOutputSchema,
  props: {
    runId: Property.ShortText({
      displayName: 'Run ID',
      description:
        'The ID returned by Start Agent Run (or List Agent Runs), e.g. "agent_run_01k4d9w6y3h7p2m8".',
      required: true,
    }),
  },
  async run(context) {
    const runId = exaInput.requiredId({ value: context.propsValue.runId, name: 'Run ID' });
    const run = await exaApi.call<AgentRun>({
      apiKey: context.auth.secret_text,
      method: HttpMethod.POST,
      path: `/agent/runs/${encodeURIComponent(runId)}/cancel`,
    });
    return agentRuns.flattenRun(run);
  },
});
