import { useTestRegistryStore } from '../../../../stores/use-test-registry-store'
import { useWebSocketStore } from '../../../../stores/use-websocket-store'
import { ModelOutput } from './model-output'
import { websocketService } from '../../../../services/websocket-service'
import { useWorkbenchStore } from '../../../../stores/use-workbench-store'
import { AgentCommand, AgentCommandUpdate } from '@activepieces/copilot-shared'
import { useState } from 'react'
import { ChevronDown, ChevronRight, Play } from 'lucide-react'

const generateTestId = () => `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

export function TestScenarios() {
  const { testRegistry } = useTestRegistryStore()
  const { selectedAgentName } = useWorkbenchStore()
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set())
  const [isRunningAll, setIsRunningAll] = useState(false)

  const handleRunTest = async (testCase: { prompt: string, title: string }, index: number) => {
    if (!selectedAgentName || !testRegistry) return

    const testId = generateTestId()
    console.debug('[TestScenarios] Running test:', testId, 'for agent:', selectedAgentName, 'with prompt:', testCase.prompt)
    
    await websocketService.sendCommand({
      type: AgentCommand.TEST_AGENT,
      command: AgentCommand.TEST_AGENT,
      data: {
        agentName: selectedAgentName,
        prompt: testCase.prompt,
        testId
      }
    })
  }

  const handleRunAllTests = async () => {
    if (!selectedAgentName || !testRegistry || isRunningAll) return

    setIsRunningAll(true)
    try {
      // Expand all rows to show results
      setExpandedRows(new Set(testRegistry.testCases.map((_, index) => index)))
      
      // Run tests sequentially to avoid overwhelming the server
      for (let i = 0; i < testRegistry.testCases.length; i++) {
        await handleRunTest(testRegistry.testCases[i], i)
      }
    } finally {
      setIsRunningAll(false)
    }
  }

  const toggleRow = (index: number) => {
    const newExpandedRows = new Set(expandedRows)
    if (expandedRows.has(index)) {
      newExpandedRows.delete(index)
    } else {
      newExpandedRows.add(index)
    }
    setExpandedRows(newExpandedRows)
  }

  if (!testRegistry) {
    return (
      <div className="text-gray-500 text-sm p-4">
        No test scenarios available. Select an agent to view test scenarios.
      </div>
    )
  }

  if (testRegistry.testCases.length === 0) {
    return (
      <div className="text-gray-500 text-sm p-4">
        No test scenarios found for agent {testRegistry.agentName}.
      </div>
    )
  }

  return (
    <div className="w-full h-full overflow-auto">
      <div className="sticky top-0 bg-white shadow-sm z-10">
        <div className="flex items-center justify-between px-4 py-3 border-b border-blue-200 bg-gradient-to-r from-blue-500 to-indigo-600">
          <h2 className="text-xs font-semibold text-white uppercase tracking-wider">Test Scenarios</h2>
          <button
            onClick={handleRunAllTests}
            disabled={isRunningAll}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white hover:text-white bg-white/20 hover:bg-white/30 rounded-md border border-white/30 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Run all tests"
          >
            <Play className="w-4 h-4" />
            <span>{isRunningAll ? 'Running All...' : 'Run All Tests'}</span>
          </button>
        </div>
        <table className="w-full border-collapse" role="table" aria-label="Test Scenarios">
          <thead>
            <tr className="bg-gradient-to-r from-gray-50 to-blue-50">
              <th className="w-12 py-3 px-4 text-left text-xs font-semibold text-blue-700 uppercase tracking-wider border-b border-blue-200">#</th>
              <th className="py-3 px-4 text-left text-xs font-semibold text-blue-700 uppercase tracking-wider border-b border-blue-200">Test Case</th>
              <th className="w-12 py-3 px-4 text-left text-xs font-semibold text-blue-700 uppercase tracking-wider border-b border-blue-200"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-blue-100">
            {testRegistry.testCases.map((testCase, index) => (
              <tr 
                key={index} 
                className="group hover:bg-blue-50/80 transition-colors duration-150"
                aria-expanded={expandedRows.has(index)}
              >
                <td className="py-4 px-4 text-sm text-blue-900 align-top whitespace-nowrap font-medium">
                  {index + 1}
                </td>
                <td className="py-4 px-4 text-sm text-gray-900">
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-medium text-blue-900">{testCase.title}</h3>
                      <div className="mt-1 text-sm text-gray-700 line-clamp-2 group-hover:line-clamp-none transition-all duration-200">
                        {testCase.prompt}
                      </div>
                    </div>
                    {expandedRows.has(index) && (
                      <div className="space-y-4 pt-2">
                        <div>
                          <h4 className="text-sm font-medium text-blue-800 mb-2">Ideal Output</h4>
                          <div className="font-mono text-sm whitespace-pre-wrap bg-white p-3 rounded-md border border-blue-200 shadow-sm">
                            {JSON.stringify(testCase.idealOutput, null, 2)}
                          </div>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-blue-800 mb-2">Model Output</h4>
                          <ModelOutput testCase={testCase} onRun={() => handleRunTest(testCase, index)} />
                        </div>
                      </div>
                    )}
                  </div>
                </td>
                <td className="py-4 px-4 text-sm text-gray-500 align-top">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleRow(index)}
                      className="p-1 text-blue-500 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 rounded-md"
                      aria-label={expandedRows.has(index) ? "Collapse test case" : "Expand test case"}
                    >
                      {expandedRows.has(index) ? (
                        <ChevronDown className="w-5 h-5" />
                      ) : (
                        <ChevronRight className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
} 