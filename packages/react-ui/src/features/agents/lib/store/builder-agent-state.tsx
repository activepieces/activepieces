import { create } from 'zustand';

import { PromiseQueue } from '@/lib/promise-queue';
import { Agent, UpdateAgentRequestBody } from '@activepieces/shared';

import { agentsApi } from '../agents-api';

const agentUpdatesQueue = new PromiseQueue();

export type BuilderAgentState = {
  agent: Agent;
  isSaving: boolean;
  setAgent: (agent: Agent) => void;
  updateAgent: (updates: UpdateAgentRequestBody) => void;
};

export const createBuilderAgentStore = (initialAgent: Agent) => {
  return create<BuilderAgentState>((set, get) => {
    return {
      agent: initialAgent,
      isSaving: false,
      setAgent: (agent: Agent) => set({ agent }),
      updateAgent: (requestBody: UpdateAgentRequestBody) => {
        set((state) => ({
          agent: {
            ...state.agent,
            displayName: requestBody.displayName ?? state.agent.displayName,
            description: requestBody.description ?? state.agent.description,
            systemPrompt: requestBody.systemPrompt ?? state.agent.systemPrompt,
            outputType: requestBody.outputType ?? state.agent.outputType,
            outputFields: requestBody.outputFields ?? state.agent.outputFields,
          },
        }));

        const currentAgent = get().agent;
        const updateRequest = async () => {
          set({ isSaving: true });
          try {
            const updatedAgent = await agentsApi.update(currentAgent.id, {
              displayName: requestBody.displayName,
              description: requestBody.description,
              systemPrompt: requestBody.systemPrompt,
              outputType: requestBody.outputType,
              outputFields: requestBody.outputFields,
            });

            set(() => ({
              agent: updatedAgent,
              isSaving: agentUpdatesQueue.size() !== 0,
            }));
          } catch (error) {
            console.error('Failed to update agent:', error);
            agentUpdatesQueue.halt();
            set({ isSaving: false });
          }
        };

        agentUpdatesQueue.add(updateRequest);
      },
    };
  });
};

export type BuilderAgentStore = ReturnType<typeof createBuilderAgentStore>;
