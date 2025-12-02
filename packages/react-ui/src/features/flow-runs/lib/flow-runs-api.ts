import { Socket } from 'socket.io-client';

import { api } from '@/lib/api';
import {
  FlowRun,
  ListFlowRunsRequestQuery,
  RetryFlowRequestBody,
  TestFlowRunRequestBody,
  WebsocketServerEvent,
  WebsocketClientEvent,
  CreateStepRunRequestBody,
  StepRunResponse,
  SeekPage,
  BulkActionOnRunsRequestBody,
  BulkArchiveActionOnRunsRequestBody,
  BulkCancelFlowRequestBody,
} from '@activepieces/shared';

type TestStepParams = {
  socket: Socket;
  request: CreateStepRunRequestBody;
  // optional callback for steps like agent and todo
  onProgress?: (progress: StepRunResponse) => void;
  onFinsih?: () => void;
};
export const flowRunsApi = {
  list(request: ListFlowRunsRequestQuery): Promise<SeekPage<FlowRun>> {
    return api.get<SeekPage<FlowRun>>('/v1/flow-runs', request);
  },
  getPopulated(id: string): Promise<FlowRun> {
    return api.get<FlowRun>(`/v1/flow-runs/${id}`);
  },
  bulkRetry(request: BulkActionOnRunsRequestBody): Promise<FlowRun[]> {
    return api.post<FlowRun[]>('/v1/flow-runs/retry', request);
  },
  bulkCancel(request: BulkCancelFlowRequestBody): Promise<FlowRun[]> {
    return api.post<FlowRun[]>('/v1/flow-runs/cancel', request);
  },
  bulkArchive(request: BulkArchiveActionOnRunsRequestBody): Promise<void> {
    return api.post<void>('/v1/flow-runs/archive', request);
  },
  retry(flowRunId: string, request: RetryFlowRequestBody): Promise<FlowRun> {
    return api.post<FlowRun>(`/v1/flow-runs/${flowRunId}/retry`, request);
  },
  async testFlow(
    socket: Socket,
    request: TestFlowRunRequestBody,
    onUpdate: (response: FlowRun) => void,
  ): Promise<void> {
    socket.emit(WebsocketServerEvent.TEST_FLOW_RUN, request);
    const initialRun = await getInitialRun(socket, request.flowVersionId);
    onUpdate(initialRun);
  },
  async testStep(params: TestStepParams): Promise<StepRunResponse> {
    const { socket, request, onProgress, onFinsih } = params;
    const stepRun = await api.post<FlowRun>(
      '/v1/sample-data/test-step',
      request,
    );

    return new Promise<StepRunResponse>((resolve, reject) => {
      const handleStepFinished = (response: StepRunResponse) => {
        if (response.runId === stepRun.id) {
          onFinsih?.();
          socket.off(
            WebsocketClientEvent.TEST_STEP_FINISHED,
            handleStepFinished,
          );
          socket.off('error', handleError);
          resolve(response);
        }
      };

      const handleError = (error: any) => {
        onFinsih?.();
        socket.off(WebsocketClientEvent.TEST_STEP_FINISHED, handleStepFinished);
        socket.off('error', handleError);
        reject(error);
      };

      socket.on(WebsocketClientEvent.TEST_STEP_FINISHED, handleStepFinished);
      socket.on('error', handleError);

      if (onProgress) {
        const handleOnProgress = (response: StepRunResponse) => {
          if (response.runId === stepRun.id) {
            onProgress(response);
          }
        };
        socket.on(WebsocketClientEvent.TEST_STEP_PROGRESS, handleOnProgress);
      }
    });
  },
};
function getInitialRun(
  socket: Socket,
  flowVersionId: string,
): Promise<FlowRun> {
  return new Promise<FlowRun>((resolve) => {
    const onRunStarted = (run: FlowRun) => {
      if (run.flowVersionId !== flowVersionId) {
        return;
      }
      socket.off(WebsocketClientEvent.TEST_FLOW_RUN_STARTED, onRunStarted);
      resolve(run);
    };

    socket.on(WebsocketClientEvent.TEST_FLOW_RUN_STARTED, onRunStarted);
  });
}
