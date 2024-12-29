import { create } from 'zustand'
import { BaseAgentConfig } from '@activepieces/copilot-shared'
import { useAgentRegistryStore } from './use-agent-registry-store'

interface WorkbenchState {
  selectedAgentName: string | null
  selectedAgent: BaseAgentConfig | null
  setSelectedAgent: (agentName: string | null) => void
}

export const useWorkbenchStore = create<WorkbenchState>((set) => ({
  selectedAgentName: null,
  selectedAgent: null,
  setSelectedAgent: (agentName: string | null) => {
    if (!agentName) {
      set({ selectedAgentName: null, selectedAgent: null })
      return
    }

    const agent = useAgentRegistryStore.getState().agents.get(agentName)
    set({
      selectedAgentName: agentName,
      selectedAgent: agent || null
    })
  }
})) 