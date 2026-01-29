import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { getEmployeeAction } from '../src/lib/actions/get-employee';

// Mock httpClient
jest.mock('@activepieces/pieces-common', () => ({
  ...jest.requireActual('@activepieces/pieces-common'),
  httpClient: {
    sendRequest: jest.fn(),
  },
}));

// Mock getOAuthToken
jest.mock('../src/lib/auth', () => ({
  getOAuthToken: jest.fn().mockResolvedValue('mock-access-token'),
  OracleFusionAuth: {},
}));

describe('getEmployeeAction', () => {
  const mockAuth = {
    baseUrl: 'https://test-oracle.example.com',
    clientId: 'test-client-id',
    clientSecret: 'test-client-secret',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should have correct metadata', () => {
    expect(getEmployeeAction.name).toBe('get_employee');
    expect(getEmployeeAction.displayName).toBe('Get Employee');
    expect(getEmployeeAction.props.workerId).toBeDefined();
  });

  test('should fetch employee by worker ID', async () => {
    const mockEmployee = {
      WorkerId: '12345',
      FirstName: 'John',
      LastName: 'Doe',
      Email: 'john.doe@example.com',
      Department: 'Engineering',
    };

    (httpClient.sendRequest as jest.Mock).mockResolvedValue({
      body: mockEmployee,
    });

    const context = {
      auth: mockAuth,
      propsValue: {
        workerId: '12345',
      },
    };

    const result = await getEmployeeAction.run(context as any);

    expect(httpClient.sendRequest).toHaveBeenCalledTimes(1);
    expect(httpClient.sendRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        method: HttpMethod.GET,
        url: 'https://test-oracle.example.com/hcmRestApi/resources/latest/workers/12345',
      })
    );
    expect(result).toEqual(mockEmployee);
  });

  test('should handle API error gracefully', async () => {
    (httpClient.sendRequest as jest.Mock).mockRejectedValue(
      new Error('Worker not found')
    );

    const context = {
      auth: mockAuth,
      propsValue: {
        workerId: 'invalid-id',
      },
    };

    await expect(getEmployeeAction.run(context as any)).rejects.toThrow(
      'Worker not found'
    );
  });

  test('should include bearer token in request', async () => {
    (httpClient.sendRequest as jest.Mock).mockResolvedValue({
      body: { WorkerId: '12345' },
    });

    const context = {
      auth: mockAuth,
      propsValue: {
        workerId: '12345',
      },
    };

    await getEmployeeAction.run(context as any);

    expect(httpClient.sendRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        authentication: {
          type: 'BEARER_TOKEN',
          token: 'mock-access-token',
        },
      })
    );
  });
});
