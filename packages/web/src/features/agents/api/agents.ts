import { SeekPage } from '@activepieces/core-utils';
import {
  Agent,
  MAX_AGENT_PAGE_SIZE,
  AgentSummary,
  AgentTemplate,
  CreateAgentRequest,
  DraftAgentRequest,
  DraftAgentResponse,
  ListAgentsRequest,
  UpdateAgentRequest,
} from '@activepieces/shared';

import { api } from '@/lib/api';

// Bounded so a runaway cursor cannot fire requests forever. Past this the page says it is
// showing a partial list rather than pretending the rest do not exist; a project that really
// holds this many agents wants server-side search instead of loading them all.
const MAX_AGENT_PAGES = 20;

export const agentsApi = {
  list(request: ListAgentsRequest): Promise<SeekPage<AgentSummary>> {
    return api.get<SeekPage<AgentSummary>>('/v1/agents', request);
  },
  async listAll(
    request: Omit<ListAgentsRequest, 'cursor' | 'limit'>,
  ): Promise<SeekPage<AgentSummary>> {
    const collected: AgentSummary[] = [];
    let cursor: string | undefined = undefined;
    for (let page = 0; page < MAX_AGENT_PAGES; page++) {
      const response: SeekPage<AgentSummary> = await agentsApi.list({
        ...request,
        limit: MAX_AGENT_PAGE_SIZE,
        ...(cursor === undefined ? {} : { cursor }),
      });
      collected.push(...response.data);
      if (!response.next) {
        return { data: collected, next: null, previous: null };
      }
      cursor = response.next;
    }
    return { data: collected, next: cursor ?? null, previous: null };
  },
  get(id: string): Promise<Agent> {
    return api.get<Agent>(`/v1/agents/${id}`);
  },
  create(request: CreateAgentRequest): Promise<Agent> {
    return api.post<Agent>('/v1/agents', request);
  },
  update(id: string, request: UpdateAgentRequest): Promise<Agent> {
    return api.post<Agent>(`/v1/agents/${id}`, request);
  },
  templates(): Promise<SeekPage<AgentTemplate>> {
    return api.get<SeekPage<AgentTemplate>>('/v1/agents/templates');
  },
  draft(request: DraftAgentRequest): Promise<DraftAgentResponse> {
    return api.post<DraftAgentResponse>('/v1/agents/draft', request);
  },
};
