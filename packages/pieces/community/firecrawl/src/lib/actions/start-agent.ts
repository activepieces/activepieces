import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { firecrawlAuth } from '../auth';
import { FIRECRAWL_API_BASE_URL } from '../common/common';
import { startAgentActionOutputSchema } from '../output-schemas';

export const startAgent = createAction({
  auth: firecrawlAuth,
  name: 'start_agent',
  displayName: 'Start Agent',
  description: 'Start an autonomous Firecrawl (FIRE-1) agent job from a natural-language prompt.',
  audience: 'ai',
  outputSchema: startAgentActionOutputSchema,
  aiMetadata: {
    description:
      'Starts an autonomous interactive-browser agent (FIRE-1) that follows a natural-language prompt to gather data, optionally constrained to given URLs and a result schema, and returns a job ID. Pick this for blocked, thin, or JS-heavy pages where Scrape/Crawl/Extract fall short; for ordinary pages prefer those cheaper actions. NOTE: /v2/agent is a beta, plan-gated endpoint that may be unavailable on your key. Read-only against the targets, so re-running is safe; poll progress with Get Agent Status.',
    idempotent: true,
  },
  props: {
    prompt: Property.LongText({
      displayName: 'Prompt',
      description: 'Natural-language instruction describing what the agent should accomplish.',
      required: true,
    }),
    urls: Property.Array({
      displayName: 'URLs',
      description: 'Optional starting URLs for the agent. Obtain them from Search Web or Map Website if needed.',
      required: false,
    }),
    schema: Property.Json({
      displayName: 'Result Schema',
      description: 'Optional JSON Schema describing the structured result to produce.',
      required: false,
    }),
    maxCredits: Property.Number({
      displayName: 'Max Credits',
      description: 'Optional credit budget cap for the agent run.',
      required: false,
    }),
    strictConstrainToURLs: Property.Checkbox({
      displayName: 'Strictly Constrain to URLs',
      description: 'If enabled, the agent may only visit the provided URLs and will not navigate elsewhere.',
      required: false,
      defaultValue: false,
    }),
  },
  async run({ auth, propsValue }) {
    const body: Record<string, any> = {
      prompt: propsValue.prompt,
    };
    if (propsValue.urls && (propsValue.urls as unknown[]).length > 0) {
      body['urls'] = (propsValue.urls as unknown[]).map((u) => String(u));
    }
    if (propsValue.schema) {
      body['schema'] = propsValue.schema;
    }
    if (propsValue.maxCredits !== undefined) {
      body['maxCredits'] = propsValue.maxCredits;
    }
    if (propsValue.strictConstrainToURLs !== undefined) {
      body['strictConstrainToURLs'] = propsValue.strictConstrainToURLs;
    }

    try {
      const response = await httpClient.sendRequest({
        method: HttpMethod.POST,
        url: `${FIRECRAWL_API_BASE_URL}/agent`,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${auth.secret_text}`,
        },
        body,
      });
      return response.body;
    } catch (error: any) {
      const status = error?.response?.status;
      if (status === 403) {
        throw new Error('Firecrawl denied the request (403): the FIRE-1 agent endpoint is beta/plan-gated and not enabled for your API key.');
      }
      if (status === 404) {
        throw new Error('Agent endpoint not found (404): /v2/agent may not be available on your plan.');
      }
      if (status === 429) {
        throw new Error('Firecrawl rate limit reached (429): slow down requests or upgrade your plan, then retry.');
      }
      throw error;
    }
  },
});
