import React, { useEffect, useState, useCallback } from 'react';
import { useWebSocket } from '../WebSocketContext';
import {
  WebsocketCopilotResult,
  WebsocketEventTypes,
} from '@activepieces/copilot-shared';


export const TestResults: React.FC = () => {
  const { socket, results } = useWebSocket();



  const renderStepContent = (result: WebsocketCopilotResult) => {
    switch (result.type) {
      case WebsocketEventTypes.PIECES_FOUND:
        return (
          <div className="space-y-2">
            <div className="text-xs text-gray-500">Found Relevant Pieces:</div>
            <div className="grid gap-2">
              {result.data.relevantPieces.map(
                (piece: { pieceName: string; content: string }, i: number) => (
                  <div
                    key={i}
                    className="bg-white p-2 rounded border border-gray-200 text-xs"
                  >
                    <div className="font-medium">{piece.pieceName}</div>
                    <div className="text-gray-600 mt-1">{piece.content}</div>
                  </div>
                )
              )}
            </div>
          </div>
        );

      case WebsocketEventTypes.PLAN_GENERATED:
        return (
          <div className="space-y-2">
            <div className="text-xs text-gray-500">Generated Plan:</div>
            <div className="bg-white p-2 rounded border border-gray-200">
              <div className="font-medium text-sm">{result.data.plan.name}</div>
              <div className="text-xs text-gray-600 mt-1">
                {result.data.plan.description}
              </div>
              <div className="mt-2 space-y-2">
                {result.data.plan.steps.map(
                  (
                    step: {
                      type: string;
                      pieceName: string;
                      actionOrTriggerName?: string;
                      condition?: string;
                    },
                    i: number
                  ) => (
                    <div key={i} className="flex items-start gap-2 text-xs">
                      <div className="bg-blue-100 text-blue-800 px-1.5 rounded">
                        {i + 1}
                      </div>
                      <div>
                        <span className="font-medium">{step.type}</span>
                        <span className="text-gray-600"> using </span>
                        <span className="font-medium">{step.pieceName}</span>
                        {step.actionOrTriggerName && (
                          <span className="text-gray-600">
                            {' '}
                            ({step.actionOrTriggerName})
                          </span>
                        )}
                        {step.condition && (
                          <div className="text-gray-600 mt-0.5">
                            Condition: {step.condition}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        );

      case WebsocketEventTypes.STEP_CREATED:
        return (
          <div className="space-y-2">
            <div className="text-xs text-gray-500">Created Step:</div>
            <div className="bg-white p-2 rounded border border-gray-200">
              <div className="font-medium text-sm">{result.data.step.name}</div>
              <div className="text-xs mt-1">
                <span className="text-gray-600">Type: </span>
                <span className="font-medium">{result.data.step.type}</span>
              </div>
              {result.data.step.piece && (
                <div className="text-xs mt-1">
                  <span className="text-gray-600">Piece: </span>
                  <span className="font-medium">
                    {result.data.step.piece.pieceName}
                  </span>
                  {(result.data.step.piece.actionName ||
                    result.data.step.piece.triggerName) && (
                    <span className="text-gray-600">
                      {' '}
                      (
                      {result.data.step.piece.actionName ||
                        result.data.step.piece.triggerName}
                      )
                    </span>
                  )}
                </div>
              )}
              {result.data.step.input && (
                <div className="mt-2">
                  <div className="text-xs text-gray-500 mb-1">
                    Input Configuration:
                  </div>
                  <pre className="text-xs bg-gray-50 p-1.5 rounded">
                    {JSON.stringify(result.data.step.input, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        );

      case WebsocketEventTypes.SCENARIO_COMPLETED:
        return (
          <div className="space-y-2">
            <div className="text-xs text-gray-500">Final Output:</div>
            <pre className="text-xs whitespace-pre-wrap bg-white p-2 rounded border border-gray-200">
              {JSON.stringify(result.data.output, null, 2)}
            </pre>
          </div>
        );

      case WebsocketEventTypes.TEST_ERROR:
        return (
          <div className="text-sm text-red-600">Error: {result.data.error}</div>
        );

      default:
        if ('message' in result.data && result.data.message) {
          return (
            <div className="text-sm text-gray-600">{result.data.message}</div>
          );
        }
        return null;
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex-none mb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-semibold">Test Results</h2>
            <span
              className={`inline-block w-3 h-3 rounded-full ${
                socket?.connected ? 'bg-green-500' : 'bg-red-500'
              }`}
            />
          </div>
          <div className="flex items-center gap-2">

          </div>
        </div>
      </div>

      <div className="flex-1 -mx-6 px-6 overflow-y-auto min-h-0">
        <div className="space-y-2 pb-2">
          {results.map((result, index) => (
            <div
              key={index}
              className="p-3 bg-gray-50 rounded shadow-sm border border-gray-100"
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <span
                    className={`font-medium text-sm ${
                      result.type === WebsocketEventTypes.TEST_ERROR
                        ? 'text-red-600'
                        : result.type === WebsocketEventTypes.SCENARIO_COMPLETED
                        ? 'text-green-600'
                        : result.type === WebsocketEventTypes.PIECES_FOUND
                        ? 'text-purple-600'
                        : result.type === WebsocketEventTypes.PLAN_GENERATED
                        ? 'text-blue-600'
                        : result.type === WebsocketEventTypes.STEP_CREATED
                        ? 'text-indigo-600'
                        : 'text-gray-900'
                    }`}
                  >
                    {result.type
                      .split('_')
                      .map(
                        (word: string) =>
                          word.charAt(0) + word.slice(1).toLowerCase()
                      )
                      .join(' ')}
                  </span>
                  
                  {(result.data as any).scenarioTitle || (result.data as any).title && (
                    <div className="text-xs text-gray-600 mt-0.5">
                      Scenario: {(result.data as any).scenarioTitle || (result.data as any).title}
                    </div>
                  )}
                </div>
                <span className="text-xs text-gray-500 whitespace-nowrap ml-2">
                  {new Date((result.data as any).timestamp).toLocaleTimeString()}
                </span>
              </div>
              <div className="overflow-x-auto">{renderStepContent(result)}</div>
            </div>
          ))}
          {results.length === 0 && (
            <div className="text-center text-gray-500 py-8 text-sm">
              No test results yet. Run a scenario to see results here.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
