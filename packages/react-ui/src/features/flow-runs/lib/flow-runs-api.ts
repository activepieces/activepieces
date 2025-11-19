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
  BulkRetryFlowRequestBody,
  SeekPage,
} from '@activepieces/shared';

type TestStepParams = {
  socket: Socket;
  request: CreateStepRunRequestBody;
} & (
  | {
      isForTodo: true;
      onProgress: (progress: StepRunResponse) => void;
    }
  | {
      isForTodo: false;
      onProgress: undefined;
    }
);

export const flowRunsApi = {
  list(request: ListFlowRunsRequestQuery): Promise<SeekPage<FlowRun>> {
    return api.get<SeekPage<FlowRun>>('/v1/flow-runs', request);
  },
  getPopulated(id: string): Promise<FlowRun> {
    return api.get<FlowRun>(`/v1/flow-runs/${id}`);
  },
  bulkRetry(request: BulkRetryFlowRequestBody): Promise<FlowRun[]> {
    return api.post<FlowRun[]>('/v1/flow-runs/retry', request);
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
    const { socket, request, isForTodo, onProgress } = params;
    const stepRun = await api.post<FlowRun>(
      '/v1/sample-data/test-step',
      request,
    );

    return new Promise<StepRunResponse>((resolve, reject) => {
      let handleStepProgress: ((response: StepRunResponse) => void) | null =
        null;
      const handleStepFinished = (response: StepRunResponse) => {
        if (response.runId === stepRun.id) {
          socket.off(
            WebsocketClientEvent.TEST_STEP_FINISHED,
            handleStepFinished,
          );
          if (handleStepProgress) {
            socket.off(
              WebsocketClientEvent.TEST_STEP_PROGRESS,
              handleStepProgress,
            );
          }
          socket.off('error', handleError);
          resolve(response);
        }
      };

      const handleError = (error: any) => {
        socket.off(WebsocketClientEvent.TEST_STEP_FINISHED, handleStepFinished);
        if (handleStepProgress) {
          socket.off(
            WebsocketClientEvent.TEST_STEP_PROGRESS,
            handleStepProgress,
          );
        }
        socket.off('error', handleError);
        reject(error);
      };
      socket.on(WebsocketClientEvent.TEST_STEP_FINISHED, handleStepFinished);
      socket.on('error', handleError);
      if (isForTodo) {
        handleStepProgress = (response: StepRunResponse) => {
          if (response.runId === stepRun.id) {
            onProgress(response);
          }
        };
        socket.on(WebsocketClientEvent.TEST_STEP_PROGRESS, handleStepProgress);
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
