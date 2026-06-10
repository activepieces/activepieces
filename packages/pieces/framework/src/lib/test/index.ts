import { ExecutionType } from '@activepieces/shared';
import { ActionContext } from '../context';
import { InputPropertyMap, StaticPropsValue } from '../property';

export function createMockActionContext<
  Props extends InputPropertyMap
>(params: {
  propsValue: StaticPropsValue<Props>;
}): ActionContext<undefined, Props> {
  return {
    executionType: ExecutionType.BEGIN,
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
      stop: () => {
        return;
      },
      pause: () => {
        return;
      },
      respond: () => {
        return;
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
