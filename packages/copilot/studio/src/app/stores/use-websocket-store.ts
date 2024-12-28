import { State, WebsocketCopilotResult } from '@activepieces/copilot-shared'
import { create } from 'zustand'

interface WebSocketStore {
  state: State | null
  results: WebsocketCopilotResult[]
  setResults: (results: WebsocketCopilotResult[]) => void
  addResult: (result: WebsocketCopilotResult) => void
  setState: (state: State) => void
  clearResults: () => void
}

export const useWebSocketStore = create<WebSocketStore>((set) => ({
  state: null,
  results: [],
  setResults: (results) => set({ results }),
  addResult: (result) =>
    set((state) => ({
      results: [...state.results, result],
    })),
  setState: (state) => set({ state }),
  clearResults: () => set({ results: [] }),
})) 