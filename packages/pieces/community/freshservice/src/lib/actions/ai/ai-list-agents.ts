import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { freshserviceAuth } from '../../../';
import { clampPage, clampPerPage, freshserviceApiCall, hasMorePages } from '../../common/client';
import { freshserviceSchemas } from '../../common/schemas';

export const aiListAgents = createAction({
  auth: freshserviceAuth,
  name: 'ai_list_agents',
  displayName: 'List Agents (AI)',
  description: 'Lists agents in Freshservice.',
  audience: 'ai',
  classification: 'SEARCH',
  outputSchema: freshserviceSchemas.agentList,
  aiMetadata: {
    description:
      'Lists Freshservice agents one page at a time. Use it to discover agent ids for assignment (responder_id, agent_id) and approvals. Continue with page while has_more is true. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    email: Property.ShortText({ displayName: 'Email', description: 'Only return the agent with this email.', required: false }),
    page: Property.Number({ displayName: 'Page', required: false }),
    per_page: Property.Number({ displayName: 'Per Page', description: '1-100, default 30.', required: false }),
  },
  async run(context) {
    const { page, per_page, email } = context.propsValue;
    const pageNumber = clampPage(page);
    const perPage = clampPerPage(per_page);
    const response = await freshserviceApiCall<{ agents: Record<string, unknown>[] }>({
      method: HttpMethod.GET,
      endpoint: 'agents',
      auth: context.auth,
      queryParams: {
        page: String(pageNumber),
        per_page: String(perPage),
        ...(email?.trim() ? { email: email.trim() } : {}),
      },
    });
    const agents = response.body.agents ?? [];
    return { agents, page: pageNumber, has_more: hasMorePages({ count: agents.length, perPage }) };
  },
});
