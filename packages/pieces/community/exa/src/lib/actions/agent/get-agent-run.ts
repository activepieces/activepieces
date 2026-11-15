import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { exaAuth } from '../../auth';
import { exaApi, exaInput } from '../../common/client';
import { AgentRun, agentRuns } from '../../common/agent';
import { agentRunOutputSchema } from '../../output-schemas';

export const getAgentRunAction = createAction({
  name: 'exa_get_agent_run',
  classification: 'READ',
  displayName: 'Get Agent Run',
  description:
    'Gets the status and result of an Exa Agent run. Use it after Start Agent Run, for example behind a Delay step.',
  audience: 'both',
  aiMetadata: {
    description:
      'Reads one Exa Agent run by id and returns its status (queued, running, completed, failed, cancelled), the text answer, the structured output when a schema was given, flattened citations and the cost. Use to poll a run started with exa_create_agent_run; it is a single read, so call it again while status is queued or running. Read-only and idempotent.',
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
      method: HttpMethod.GET,
      path: `/agent/runs/${encodeURIComponent(runId)}`,
    });
    return agentRuns.flattenRun(run);
  },
});
