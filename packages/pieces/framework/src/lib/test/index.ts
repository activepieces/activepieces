import { ExecutionType, ResumePayload, TriggerStrategy } from '@activepieces/core-piece-types';
import {
  ActionContext,
  CreateWaitpointParams,
  CreateWaitpointResult,
  SetScheduleRequest,
  TriggerHookContext,
} from '../context';
import { InputPropertyMap, StaticPropsValue } from '../property';

export function createMockActionContext<
  Props extends InputPropertyMap
>(params: {
  propsValue: StaticPropsValue<Props>;
  resumePayload?: ResumePayload;
  canPause?: boolean;
  onCreateWaitpoint?: (waitpoint: CreateWaitpointParams) => void;
  onWaitForWaitpoint?: (waitpointId: string) => void;
}): ActionContext<undefined, Props> {
  return {
    executionType: params.resumePayload ? ExecutionType.RESUME : ExecutionType.BEGIN,
    resumePayload: params.resumePayload,
    auth: undefined,
    propsValue: params.propsValue,
    store: {
      put: async <T>(key: string, value: T) => value,
      get: async () => null,
      delete: async () => {
        return;
      },
    },
    connections: {
      get: async () => null,
    },
    tags: {
      add: async () => {
        return;
      },
    },
    server: {
      apiUrl: 'http://localhost:3000',
      publicUrl: 'http://localhost:4200',
      token: 'test-token',
    },
    files: {
      write: async () => 'test-file-url',
      upload: async () => ({ id: 'test-file-id', url: 'test-file-url' }),
    },
    output: {
      update: async () => {
        return;
      },
    },
    agent: {
      tools: async () => ({}),
    },
    run: {
      id: 'test-run-id' as string,
      canPause: params.canPause ?? true,
      stop: () => {
        return;
      },
      pause: () => {
        return;
      },
      respond: () => {
        return;
      },
      createWaitpoint: async (waitpoint: CreateWaitpointParams): Promise<CreateWaitpointResult> => {
        params.onCreateWaitpoint?.(waitpoint);
        return {
          id: 'test-waitpoint-id',
          resumeUrl: 'http://localhost:3000/resume',
          buildResumeUrl: () => 'http://localhost:3000/resume',
        };
      },
      waitForWaitpoint: (waitpointId: string) => {
        params.onWaitForWaitpoint?.(waitpointId);
      },
    },
    project: {
      id: 'test-project-id',
      externalId: async () => undefined,
    },
    flows: {
      list: async () => ({ data: [], next: null, previous: null }),
      current: {
        id: 'test-flow-id',
        version: {
          id: 'test-flow-version-id',
        },
      },
    },
    step: {
      name: 'test-step',
    },
    generateResumeUrl: () => 'http://localhost:3000/resume',
  } as unknown as ActionContext<undefined, Props>;
}

export function createMockPollingTriggerContext<
  Props extends InputPropertyMap
>(params: {
  propsValue: StaticPropsValue<Props>;
  onSetSchedule?: (schedule: SetScheduleRequest) => void;
}): TriggerHookContext<undefined, Props, TriggerStrategy.POLLING> {
  return {
    ...createMockActionContext({ propsValue: params.propsValue }),
    setSchedule: (schedule: SetScheduleRequest) => {
      params.onSetSchedule?.(schedule);
    },
  } as unknown as TriggerHookContext<undefined, Props, TriggerStrategy.POLLING>;
}
