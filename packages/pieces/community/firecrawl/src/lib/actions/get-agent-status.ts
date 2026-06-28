import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { firecrawlAuth } from '../auth';
import { FIRECRAWL_API_BASE_URL } from '../common/common';

export const getAgentStatus = createAction({
  auth: firecrawlAuth,
  name: 'get_agent_status',
  displayName: 'Get Agent Status',
  description: 'Get the status and result of a Firecrawl (FIRE-1) agent job by its ID.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Looks up the status and result of a FIRE-1 agent job by its ID. Pick this to poll the job started by Start Agent until it completes. NOTE: /v2/agent is a beta, plan-gated endpoint that may be unavailable on your key. Read-only, so repeating the call is safe.',
    idempotent: true,
  },
  props: {
    jobId: Property.ShortText({
      displayName: 'Agent Job ID',
      description: 'The ID of the agent job to check. Obtain it from the Start Agent action result.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    try {
      const response = await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: `${FIRECRAWL_API_BASE_URL}/agent/${propsValue.jobId}`,
        headers: {
          'Authorization': `Bearer ${auth.secret_text}`,
        },
      });
      return response.body;
    } catch (error: any) {
      const status = error?.response?.status;
      if (status === 403) {
        throw new Error('Firecrawl denied the request (403): the FIRE-1 agent endpoint is beta/plan-gated and not enabled for your API key.');
      }
      if (status === 404) {
        throw new Error('Agent job not found (404): the job ID does not exist, has expired, or /v2/agent is unavailable on your plan.');
      }
      if (status === 429) {
        throw new Error('Firecrawl rate limit reached (429): slow down requests or upgrade your plan, then retry.');
      }
      throw error;
    }
  },
});
