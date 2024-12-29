import { WebsocketCopilotResult } from '@activepieces/copilot-shared'
import { create } from 'zustand'

interface WebSocketStore {
  results: WebsocketCopilotResult[]
  setResults: (results: WebsocketCopilotResult[]) => void
  addResult: (result: WebsocketCopilotResult) => void
  clearResults: () => void
}

export const useWebSocketStore = create<WebSocketStore>((set) => ({
  results: [],
  setResults: (results) => set({ results }),
  addResult: (result) =>
    set((state) => ({
      results: [...state.results, result],
    })),
  clearResults: () => set({ results: [] }),
})) 