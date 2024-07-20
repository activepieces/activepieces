import { api } from '@/lib/api';
import {
  CreateStepRunRequestBody,
  FlowOperationRequest,
  FlowVersion,
  FlowVersionMetadata,
  GetFlowQueryParamsRequest,
  ListFlowVersionRequest,
  ListFlowsRequest,
  PopulatedFlow,
  SeekPage,
  StepRunResponse,
  WebsocketClientEvent,
  WebsocketServerEvent,
} from '@activepieces/shared';
import { nanoid } from 'nanoid';
import { Socket } from 'socket.io-client';

export const flowsApi = {
  applyOperation(flowId: string, operation: FlowOperationRequest) {
    return api.post<void>(`/v1/flows/${flowId}`, operation);
  },
  list(request: ListFlowsRequest): Promise<SeekPage<PopulatedFlow>> {
    return api.get<SeekPage<PopulatedFlow>>('/v1/flows', request);
  },
  update(flowId: string, request: FlowOperationRequest) {
    return api.post<PopulatedFlow>(`/v1/flows/${flowId}`, request);
  },
  testStep(socket: Socket, request:  Omit<CreateStepRunRequestBody, 'id'>) {
    const id = nanoid();
    socket.emit(WebsocketServerEvent.TEST_STEP_RUN, {
      ...request,
      id,
    });
    return new Promise<StepRunResponse>((resolve, reject) => {
      socket.on(WebsocketClientEvent.TEST_STEP_FINISHED, (response) => {
        if (response.id === id) {
          resolve(response);
        }
      });
      socket.on('error', (error) => {
        reject(error);
      });
    });
  },
  get(
    flowId: string,
    request?: GetFlowQueryParamsRequest,
  ): Promise<PopulatedFlow> {
    return api.get<PopulatedFlow>(`/v1/flows/${flowId}`, request);
  },
  listVersions(
    flowId: string,
    request: ListFlowVersionRequest,
  ): Promise<SeekPage<FlowVersionMetadata>> {
    return api.get<SeekPage<FlowVersion>>(
      `/v1/flows/${flowId}/versions`,
      request,
    );
  },
};
