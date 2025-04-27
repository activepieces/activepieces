import { handleMcpRequest } from '../mcp/handlers';
import { McpRequest } from '../types';
import * as hulyApi from '../api/hulyApi';

// Mock the Huly API functions
jest.mock('../api/hulyApi');

describe('MCP Request Handlers', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  test('should handle findPerson requests', async () => {
    // Mock the API response
    const mockPeople = [
      { id: '1', name: 'John Doe', channels: [{ type: 'email', value: 'john@example.com' }] }
    ];
    (hulyApi.findPerson as jest.Mock).mockResolvedValue(mockPeople);

    // Create a mock request
    const request: McpRequest = {
      jsonrpc: '2.0',
      id: '1',
      method: 'huly.findPerson',
      params: { query: 'John' }
    };

    // Execute the handler
    const response = await handleMcpRequest(request);

    // Verify the result
    expect(response).toEqual({
      jsonrpc: '2.0',
      id: '1',
      result: mockPeople
    });
    expect(hulyApi.findPerson).toHaveBeenCalledWith('John');
  });

  test('should handle findProject requests', async () => {
    // Mock the API response
    const mockProjects = [
      { id: '1', name: 'Project Alpha', description: 'This is a test project' }
    ];
    (hulyApi.findProject as jest.Mock).mockResolvedValue(mockProjects);

    // Create a mock request
    const request: McpRequest = {
      jsonrpc: '2.0',
      id: '2',
      method: 'huly.findProject',
      params: { name: 'Alpha' }
    };

    // Execute the handler
    const response = await handleMcpRequest(request);

    // Verify the result
    expect(response).toEqual({
      jsonrpc: '2.0',
      id: '2',
      result: mockProjects
    });
    expect(hulyApi.findProject).toHaveBeenCalledWith(undefined, 'Alpha');
  });

  test('should handle createPerson requests', async () => {
    // Mock the API response
    const mockPerson = {
      id: '1',
      name: 'Jane Doe',
      channels: [{ type: 'email', value: 'jane@example.com' }]
    };
    (hulyApi.createPerson as jest.Mock).mockResolvedValue(mockPerson);

    // Create a mock request
    const request: McpRequest = {
      jsonrpc: '2.0',
      id: '3',
      method: 'huly.createPerson',
      params: { 
        name: 'Jane Doe',
        email: 'jane@example.com'
      }
    };

    // Execute the handler
    const response = await handleMcpRequest(request);

    // Verify the result
    expect(response).toEqual({
      jsonrpc: '2.0',
      id: '3',
      result: mockPerson
    });
    expect(hulyApi.createPerson).toHaveBeenCalledWith('Jane Doe', 'jane@example.com');
  });

  test('should return error for invalid method', async () => {
    // Create a mock request with an invalid method
    const request: McpRequest = {
      jsonrpc: '2.0',
      id: '4',
      method: 'huly.invalidMethod',
      params: {}
    };

    // Execute the handler
    const response = await handleMcpRequest(request);

    // Verify the error response
    expect(response).toEqual({
      jsonrpc: '2.0',
      id: '4',
      error: {
        code: -32601,
        message: 'Method not found: huly.invalidMethod'
      }
    });
  });

  test('should return error for invalid params', async () => {
    // Create a mock request with invalid parameters
    const request: McpRequest = {
      jsonrpc: '2.0',
      id: '5',
      method: 'huly.createIssue',
      params: { 
        // Missing required projectId and title
      }
    };

    // Execute the handler
    const response = await handleMcpRequest(request);

    // Verify the error response
    expect(response).toHaveProperty('error');
    expect(response.error?.code).toBe(-32602);
    expect(response.error?.message).toContain('Invalid params');
  });
});
