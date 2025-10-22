import { create } from 'zustand';

import { PromiseQueue } from '@/lib/promise-queue';
import {
  Agent,
  UpdateAgentRequestBody,
  debounce,
  spreadIfDefined,
} from '@activepieces/shared';

import { agentsApi } from '../agents-api';

const agentUpdatesQueue = new PromiseQueue();

const debouncedAddToQueue = debounce((updateRequest: () => Promise<void>) => {
  agentUpdatesQueue.add(updateRequest);
}, 500);

export type BuilderAgentState = {
  agent: Agent;
  isSaving: boolean;
  setAgent: (agent: Agent) => void;
  updateAgent: (
    updates: UpdateAgentRequestBody,
    debounceUpdate?: boolean,
  ) => void;
  testSectionIsOpen: boolean;
  setTestSectionIsOpen: (isOpen: boolean) => void;
};

export const createBuilderAgentStore = (initialAgent: Agent) => {
  return create<BuilderAgentState>((set, get) => {
    return {
      agent: initialAgent,
      isSaving: false,
      testSectionIsOpen: false,
      setTestSectionIsOpen: (isOpen: boolean) =>
        set({ testSectionIsOpen: isOpen }),
      setAgent: (agent: Agent) => set({ agent }),
      updateAgent: (
        requestBody: UpdateAgentRequestBody,
        debounceUpdate?: boolean,
      ) => {
        set((state) => ({
          agent: {
            ...state.agent,
            ...spreadIfDefined('displayName', requestBody.displayName),
            ...spreadIfDefined('description', requestBody.description),
            ...spreadIfDefined('systemPrompt', requestBody.systemPrompt),
            ...spreadIfDefined('outputType', requestBody.outputType),
            ...spreadIfDefined('outputFields', requestBody.outputFields),
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

        if (debounceUpdate) {
          debouncedAddToQueue(undefined, updateRequest);
        } else {
          agentUpdatesQueue.add(updateRequest);
        }
      },
    };
  });
};

export type BuilderAgentStore = ReturnType<typeof createBuilderAgentStore>;
