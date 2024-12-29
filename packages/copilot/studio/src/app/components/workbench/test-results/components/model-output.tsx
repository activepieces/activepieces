import { useWebSocketStore } from '../../../../stores/use-websocket-store'
import { AgentCommandUpdate } from '@activepieces/copilot-shared'

interface TestCase {
  title: string
  prompt: string
  idealOutput: Record<string, any>
}

interface ModelOutputProps {
  testCase: TestCase
  onRun: () => void
}

export function ModelOutput({ testCase, onRun }: ModelOutputProps) {
  const { results } = useWebSocketStore()

  // Find all relevant updates for this test case
  const testUpdates = results.filter(result => {
    return (
      (result.type === AgentCommandUpdate.AGENT_TEST_STARTED ||
        result.type === AgentCommandUpdate.AGENT_TEST_COMPLETED ||
        result.type === AgentCommandUpdate.AGENT_TEST_ERROR) &&
      result.data?.prompt === testCase.prompt
    )
  })

  // Get the latest update
  const latestUpdate = testUpdates[testUpdates.length - 1]

  if (!latestUpdate) {
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

  if (latestUpdate.type === AgentCommandUpdate.AGENT_TEST_STARTED) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex items-center gap-2 text-gray-600">
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <span>Running test...</span>
        </div>
      </div>
    )
  }

  if (latestUpdate.type === AgentCommandUpdate.AGENT_TEST_ERROR) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="text-red-600 font-medium">Error</div>
          <button
            onClick={onRun}
            className="px-2 py-1 text-xs font-medium text-gray-700 hover:text-gray-900 bg-white hover:bg-gray-50 rounded-md border border-gray-200 transition-colors duration-200"
          >
            Retry
          </button>
        </div>
        <div className="font-mono text-xs text-red-600 whitespace-pre-wrap bg-red-50 p-3 rounded-md">
          {latestUpdate.data?.error?.message || 'Unknown error'}
        </div>
      </div>
    )
  }

  if (latestUpdate.type === AgentCommandUpdate.AGENT_TEST_COMPLETED) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="text-green-600 font-medium">Completed</div>
          <button
            onClick={onRun}
            className="px-2 py-1 text-xs font-medium text-gray-700 hover:text-gray-900 bg-white hover:bg-gray-50 rounded-md border border-gray-200 transition-colors duration-200"
          >
            Run Again
          </button>
        </div>
        <div className="font-mono whitespace-pre-wrap bg-gray-50 p-3 rounded-md">
          {JSON.stringify(latestUpdate.data?.result, null, 2)}
        </div>
      </div>
    )
  }

  return null
} 