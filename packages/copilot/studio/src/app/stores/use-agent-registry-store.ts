import { create } from 'zustand'
import { BaseAgentConfig } from '@activepieces/copilot-shared'

interface AgentRegistryState {
  agents: Map<string, BaseAgentConfig>
  setAgents: (agents: Map<string, BaseAgentConfig>) => void
  addAgent: (name: string, config: BaseAgentConfig) => void
  removeAgent: (name: string) => void
  clearAgents: () => void
}

export const useAgentRegistryStore = create<AgentRegistryState>((set) => ({
  agents: new Map(),
  setAgents: (agents) => set({ agents }),
  addAgent: (name, config) =>
    set((state) => {
      const newAgents = new Map(state.agents)
      newAgents.set(name, config)
      return { agents: newAgents }
    }),
  removeAgent: (name) =>
    set((state) => {
      const newAgents = new Map(state.agents)
      newAgents.delete(name)
      return { agents: newAgents }
    }),
  clearAgents: () => set({ agents: new Map() }),
})) 