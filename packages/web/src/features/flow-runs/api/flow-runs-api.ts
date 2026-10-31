import { SeekPage } from '@activepieces/core-utils';
import {
  CountFlowRunsByStatusRequest,
  CountFlowRunsByStatusResponse,
  FlowRun,
  FlowRunWithRetryError,
  ListFlowRunsRequestQuery,
  RetryFlowRequestBody,
  TestFlowRunRequestBody,
  WebsocketServerEvent,
  WebsocketClientEvent,
  CreateStepRunRequestBody,
  BulkActionOnRunsRequestBody,
  BulkArchiveActionOnRunsRequestBody,
  BulkCancelFlowRequestBody,
  UpdateRunProgressRequest,
} from '@activepieces/shared';
import { Socket } from 'socket.io-client';

import { api } from '@/lib/api';

type TestStepParams = {
  request: CreateStepRunRequestBody;
};
export const flowRunsApi = {
  list(request: ListFlowRunsRequestQuery): Promise<SeekPage<FlowRun>> {
    return api.get<SeekPage<FlowRun>>('/v1/flow-runs', request);
  },
  countByStatus(
    request: CountFlowRunsByStatusRequest,
  ): Promise<CountFlowRunsByStatusResponse> {
    return api.get<CountFlowRunsByStatusResponse>(
      '/v1/flow-runs/count-by-status',
      request,
    );
  },
  getPopulated(id: string): Promise<FlowRun> {
    return api.get<FlowRun>(`/v1/flow-runs/${id}`);
  },
  bulkRetry(
    request: BulkActionOnRunsRequestBody,
  ): Promise<FlowRunWithRetryError[]> {
    return api.post<FlowRunWithRetryError[]>('/v1/flow-runs/retry', request);
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
  async subscribeToTestFlowOrManualRun({
    socket,
    request,
    onUpdate,
    isForManualTrigger,
    signal,
  }: SubscribeToTestFlowOrManualRunParams): Promise<void> {
    socket.emit(
      isForManualTrigger
        ? WebsocketServerEvent.MANUAL_TRIGGER_RUN_STARTED
        : WebsocketServerEvent.TEST_FLOW_RUN,
      request,
    );
    const initialRun = await getInitialRun({
      socket,
      flowVersionId: request.flowVersionId,
      forManualTrigger: isForManualTrigger,
      signal,
    });
    if (signal.aborted) {
      return;
    }
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
    signal.addEventListener(
      'abort',
      () =>
        socket.off(
          WebsocketClientEvent.UPDATE_RUN_PROGRESS,
          handleUpdateRunProgress,
        ),
      { once: true },
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
function getInitialRun({
  socket,
  flowVersionId,
  forManualTrigger,
  signal,
}: GetInitialRunParams): Promise<FlowRun> {
  const startedEvent = forManualTrigger
    ? WebsocketClientEvent.MANUAL_TRIGGER_RUN_STARTED
    : WebsocketClientEvent.TEST_FLOW_RUN_STARTED;
  return new Promise<FlowRun>((resolve) => {
    const onRunStarted = (run: FlowRun) => {
      if (run.flowVersionId !== flowVersionId) {
        return;
      }
      socket.off(startedEvent, onRunStarted);
      resolve(run);
    };
    socket.on(startedEvent, onRunStarted);
    signal.addEventListener(
      'abort',
      () => socket.off(startedEvent, onRunStarted),
      { once: true },
    );
  });
}

type SubscribeToTestFlowOrManualRunParams = {
  socket: Socket;
  request: TestFlowRunRequestBody;
  onUpdate: (response: UpdateRunProgressRequest) => void;
  isForManualTrigger: boolean;
  signal: AbortSignal;
};
type GetInitialRunParams = {
  socket: Socket;
  flowVersionId: string;
  forManualTrigger: boolean;
  signal: AbortSignal;
};
