import { useWebSocketStore } from '../../../../stores/use-websocket-store'
import { AgentCommandUpdate } from '@activepieces/copilot-shared'
import { Play, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react'

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
      <div className="flex items-center justify-start">
        <button
          onClick={onRun}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md border border-blue-500 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-sm"
          aria-label="Run test"
        >
          <Play className="w-4 h-4" />
          <span>Run Test</span>
        </button>
      </div>
    )
  }

  if (latestUpdate.type === AgentCommandUpdate.AGENT_TEST_STARTED) {
    return (
      <div className="flex items-center gap-2 text-blue-600 font-medium" role="status" aria-label="Test running">
        <RefreshCw className="w-4 h-4 animate-spin" />
        <span>Running test...</span>
      </div>
    )
  }

  if (latestUpdate.type === AgentCommandUpdate.AGENT_TEST_ERROR) {
    return (
      <div className="space-y-3" role="alert" aria-label="Test failed">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-red-600 font-medium">
            <AlertCircle className="w-4 h-4" />
            <span>Error</span>
          </div>
          <button
            onClick={onRun}
            className="inline-flex items-center gap-1.5 px-2 py-1 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md border border-blue-500 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-sm"
            aria-label="Retry test"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Retry</span>
          </button>
        </div>
        <div className="font-mono text-xs text-red-700 whitespace-pre-wrap bg-red-50 p-3 rounded-md border border-red-200 shadow-sm">
          {latestUpdate.data?.error?.message || 'Unknown error'}
        </div>
      </div>
    )
  }

  if (latestUpdate.type === AgentCommandUpdate.AGENT_TEST_COMPLETED) {
    return (
      <div className="space-y-3" role="status" aria-label="Test completed">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-emerald-600 font-medium">
            <CheckCircle2 className="w-4 h-4" />
            <span>Completed</span>
          </div>
          <button
            onClick={onRun}
            className="inline-flex items-center gap-1.5 px-2 py-1 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md border border-blue-500 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-sm"
            aria-label="Run test again"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Run Again</span>
          </button>
        </div>
        <div className="font-mono text-sm text-gray-800 whitespace-pre-wrap bg-white p-3 rounded-md border border-blue-200 shadow-sm">
          {JSON.stringify(latestUpdate.data?.result, null, 2)}
        </div>
      </div>
    )
  }

  return null
} 