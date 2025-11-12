// Custom
import { api } from '@/lib/api';
import { authenticationSession } from '@/lib/authentication-session';
import { BuilderMessage, BuilderMessageRoleSchema } from '@activepieces/shared';
import { Static, Type } from '@sinclair/typebox';

const PromptMessage = Type.Object({
  role: BuilderMessageRoleSchema,
  content: Type.String(),
  created: Type.Optional(Type.String()), // ISO string
});

export type PromptMessage = Static<typeof PromptMessage>;

export const promptFlowApi = {
  chat(flowId: string, messages: PromptMessage[]): Promise<string> {
    return api.post<string>(`/v1/builder/flow/${flowId}`, {
      messages,
    });
  },
  get(flowId: string): Promise<BuilderMessage[]> {
    return api.get<BuilderMessage[]>(`/v1/builder/flow/${flowId}`);
  },
  async getCreditUsage(
    API_URL: string,
    projectId: string,
    flowId: string,
  ): Promise<number> {
    const response = await api.get<{
      project_credits: number;
      project_id: string;
    }>(`${API_URL}/botx/v1/project-credits/${projectId}/${flowId}`, undefined, {
      headers: {
        Authorization: `Bearer ${authenticationSession.getBotxToken()}`,
      },
    });
    return response.project_credits ?? 0;
  },
};
