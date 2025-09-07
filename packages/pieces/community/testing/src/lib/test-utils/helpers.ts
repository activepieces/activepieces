import { ActionContext } from '@activepieces/pieces-framework';

/**
 * Helper function to create a mock context for testing actions
 */
export function createMockContext(props: Record<string, any> = {}): ActionContext<any, any> {
  return {
    executionType: 'BEGIN' as any,
    tags: {
      add: jest.fn().mockResolvedValue(undefined),
    } as any,
    server: {
      apiUrl: 'http://localhost:3000',
      publicUrl: 'http://localhost:3000',
      token: 'mock-token',
    },
    files: {
      write: jest.fn().mockResolvedValue('mock-file-id'),
    } as any,
    output: {
      update: jest.fn().mockResolvedValue(undefined),
    },
    serverUrl: 'http://localhost:3000',
    run: {
      id: 'mock-run-id',
      stop: jest.fn(),
      pause: jest.fn(),
      respond: jest.fn(),
    },
    generateResumeUrl: jest.fn().mockReturnValue('mock-resume-url'),
    flows: {} as any,
    auth: {},
    propsValue: props,
    store: {
      put: jest.fn().mockResolvedValue(undefined),
      get: jest.fn().mockResolvedValue(null),
      delete: jest.fn().mockResolvedValue(undefined),
    } as any,
    project: {
      id: 'mock-project-id',
      externalId: jest.fn().mockResolvedValue('mock-external-id'),
    },
    connections: {
      get: jest.fn().mockResolvedValue(null),
    } as any,
  };
}

/**
 * Helper function to create a mock piece context
 */
export function createMockPieceContext() {
  return {
    auth: {
      type: 'none',
    },
    actions: [],
    triggers: [],
  };
}

/**
 * Helper function to validate action properties
 */
export function validateActionProperties(action: any, expectedProps: string[]) {
  expect(action.props).toBeDefined();
  expectedProps.forEach(prop => {
    expect(action.props[prop]).toBeDefined();
  });
}

/**
 * Helper function to validate action metadata
 */
export function validateActionMetadata(action: any, expectedName: string, expectedDisplayName: string) {
  expect(action.name).toBe(expectedName);
  expect(action.displayName).toBe(expectedDisplayName);
  expect(action.description).toBeDefined();
  expect(typeof action.run).toBe('function');
}
