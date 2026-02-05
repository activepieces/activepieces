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
  SeekPage,
  BulkActionOnRunsRequestBody,
  BulkArchiveActionOnRunsRequestBody,
  BulkCancelFlowRequestBody,
  UpdateRunProgressRequest,
} from '@activepieces/shared';

type TestStepParams = {
  request: CreateStepRunRequestBody;
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
  async subscribeToTestFlowOrManualRun(
    socket: Socket,
    request: TestFlowRunRequestBody,
    onUpdate: (response: UpdateRunProgressRequest) => void,
    isForManualTrigger: boolean,
  ): Promise<void> {
    socket.emit(
      isForManualTrigger
        ? WebsocketServerEvent.MANUAL_TRIGGER_RUN_STARTED
        : WebsocketServerEvent.TEST_FLOW_RUN,
      request,
    );
    const initialRun = await getInitialRun(
      socket,
      request.flowVersionId,
      isForManualTrigger,
    );
    onUpdate({
      flowRun: initialRun,
    });
    const handleUpdateRunProgress = (response: UpdateRunProgressRequest) => {
      if (response.flowRun.id === initialRun.id) {
        onUpdate(response);
        if (response.flowRun.finishTime) {
          socket.off(
            WebsocketClientEvent.UPDATE_RUN_PROGRESS,
            handleUpdateRunProgress,
          );
        }
      }
    };
    socket.on(
      WebsocketClientEvent.UPDATE_RUN_PROGRESS,
      handleUpdateRunProgress,
    );
  },
  async testStep(params: TestStepParams): Promise<{ runId: string }> {
    const { request } = params;
    const stepRun = await api.post<FlowRun>(
      '/v1/sample-data/test-step',
      request,
    );
    return { runId: stepRun.id };
  },
};
function getInitialRun(
  socket: Socket,
  flowVersionId: string,
  forManualTrigger: boolean,
): Promise<FlowRun> {
  return new Promise<FlowRun>((resolve) => {
    const onRunStarted = (run: FlowRun) => {
      if (run.flowVersionId !== flowVersionId) {
        return;
      }
      if (forManualTrigger) {
        socket.off(
          WebsocketClientEvent.MANUAL_TRIGGER_RUN_STARTED,
          onRunStarted,
        );
      } else {
        socket.off(WebsocketClientEvent.TEST_FLOW_RUN_STARTED, onRunStarted);
      }
      resolve(run);
    };

    if (forManualTrigger) {
      socket.on(WebsocketClientEvent.MANUAL_TRIGGER_RUN_STARTED, onRunStarted);
    } else {
      socket.on(WebsocketClientEvent.TEST_FLOW_RUN_STARTED, onRunStarted);
    }
  });
}
