import { nanoid } from 'nanoid';
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
  testStep(
    socket: Socket,
    request: Omit<CreateStepRunRequestBody, 'id'>,
    onProgress?: (progress: StepRunResponse) => void,
  ): Promise<StepRunResponse> {
    const id = nanoid();
    socket.emit(WebsocketServerEvent.TEST_STEP_RUN, {
      ...request,
      id,
    });

    return new Promise<StepRunResponse>((resolve, reject) => {
      const handleStepFinished = (response: StepRunResponse) => {
        if (response.id === id) {
          socket.off(
            WebsocketClientEvent.TEST_STEP_FINISHED,
            handleStepFinished,
          );
          onProgress?.(response);
          socket.off('error', handleError);

          resolve(response);
        }
      };

      const handleProgress = (progress: StepRunResponse) => {
        if (progress.id === id) {
          onProgress?.(progress);
        }
      };

      const handleError = (error: any) => {
        socket.off(WebsocketClientEvent.TEST_STEP_FINISHED, handleStepFinished);
        socket.off(WebsocketClientEvent.TEST_STEP_PROGRESS, handleProgress);
        socket.off('error', handleError);
        reject(error);
      };
      socket.on(WebsocketClientEvent.TEST_STEP_FINISHED, handleStepFinished);
      socket.on(WebsocketClientEvent.TEST_STEP_PROGRESS, handleProgress);
      socket.on('error', handleError);
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
