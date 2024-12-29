import { useWebSocketStore } from '../../../../stores/use-websocket-store'
import { AgentCommandUpdate } from '@activepieces/copilot-shared'

interface ModelOutputProps {
  testIndex: number
  onRun: () => void
}

export function ModelOutput({ testIndex, onRun }: ModelOutputProps) {
  const { results } = useWebSocketStore()

  // Find the latest test result for this test case
  const latestResult = results
    .filter(result => result.type === AgentCommandUpdate.AGENT_TEST_COMPLETED)
    .find(result => result.data?.testIndex === testIndex)

  if (!latestResult) {
    return (
      <div className="flex items-center justify-center h-full">
        <button
          onClick={onRun}
          className="px-3 py-1.5 text-sm font-medium text-gray-700 hover:text-gray-900 bg-white hover:bg-gray-50 rounded-md border border-gray-200 transition-colors duration-200"
        >
          Run
        </button>
      </div>
    )
  }

  return (
    <div className="font-mono whitespace-pre-wrap bg-gray-50 p-3 rounded-md">
      {JSON.stringify(latestResult.data?.output, null, 2)}
    </div>
  )
} 