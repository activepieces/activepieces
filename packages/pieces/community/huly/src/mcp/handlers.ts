import {
  McpRequest,
  McpResponse,
  FindPersonParamsSchema,
  FindProjectParamsSchema,
  FindIssueParamsSchema,
  FindDocumentParamsSchema,
  CreatePersonParamsSchema,
  CreateIssueParamsSchema,
  CreateMilestoneParamsSchema,
  CreateDocumentParamsSchema
} from '../types';

import {
  findPerson,
  findProject,
  findIssue,
  findDocument,
  createPerson,
  createIssue,
  createMilestone,
  createDocument
} from '../api/hulyApi';

/**
 * Process an MCP request and return a response
 */
export async function handleMcpRequest(request: McpRequest): Promise<McpResponse> {
  try {
    // Basic validation for RPC format
    if (request.jsonrpc !== '2.0') {
      return createErrorResponse(request.id, -32600, 'Invalid Request: Not JSON-RPC 2.0');
    }

    // Route the request to the appropriate handler
    switch (request.method) {
      // Search operations
      case 'huly.findPerson':
        return await handleFindPerson(request);
      case 'huly.findProject':
        return await handleFindProject(request);
      case 'huly.findIssue':
        return await handleFindIssue(request);
      case 'huly.findDocument':
        return await handleFindDocument(request);
        
      // Create operations
      case 'huly.createPerson':
        return await handleCreatePerson(request);
      case 'huly.createIssue':
        return await handleCreateIssue(request);
      case 'huly.createMilestone':
        return await handleCreateMilestone(request);
      case 'huly.createDocument':
        return await handleCreateDocument(request);
        
      // Method not found
      default:
        return createErrorResponse(request.id, -32601, `Method not found: ${request.method}`);
    }
  } catch (error: any) {
    console.error('Error handling MCP request:', error);
    return createErrorResponse(
      request.id,
      -32603,
      `Internal error: ${error.message || 'Unknown error'}`
    );
  }
}

/**
 * Search operation handlers
 */
async function handleFindPerson(request: McpRequest): Promise<McpResponse> {
  try {
    // Validate parameters
    const result = FindPersonParamsSchema.safeParse(request.params);
    if (!result.success) {
      return createErrorResponse(
        request.id,
        -32602,
        `Invalid params: ${result.error.message}`
      );
    }

    // Call the API
    const people = await findPerson(result.data.query);
    return createSuccessResponse(request.id, people);
  } catch (error: any) {
    return createErrorResponse(
      request.id,
      -32000,
      `Failed to find person: ${error.message}`
    );
  }
}

async function handleFindProject(request: McpRequest): Promise<McpResponse> {
  try {
    // Validate parameters
    const result = FindProjectParamsSchema.safeParse(request.params);
    if (!result.success) {
      return createErrorResponse(
        request.id,
        -32602,
        `Invalid params: ${result.error.message}`
      );
    }

    // Call the API
    const projects = await findProject(result.data.id, result.data.name);
    return createSuccessResponse(request.id, projects);
  } catch (error: any) {
    return createErrorResponse(
      request.id,
      -32000,
      `Failed to find project: ${error.message}`
    );
  }
}

async function handleFindIssue(request: McpRequest): Promise<McpResponse> {
  try {
    // Validate parameters
    const result = FindIssueParamsSchema.safeParse(request.params);
    if (!result.success) {
      return createErrorResponse(
        request.id,
        -32602,
        `Invalid params: ${result.error.message}`
      );
    }

    // Call the API
    const issues = await findIssue(result.data.projectId);
    return createSuccessResponse(request.id, issues);
  } catch (error: any) {
    return createErrorResponse(
      request.id,
      -32000,
      `Failed to find issues: ${error.message}`
    );
  }
}

async function handleFindDocument(request: McpRequest): Promise<McpResponse> {
  try {
    // Validate parameters
    const result = FindDocumentParamsSchema.safeParse(request.params);
    if (!result.success) {
      return createErrorResponse(
        request.id,
        -32602,
        `Invalid params: ${result.error.message}`
      );
    }

    // Call the API
    const documents = await findDocument(result.data.teamspaceId, result.data.name);
    return createSuccessResponse(request.id, documents);
  } catch (error: any) {
    return createErrorResponse(
      request.id,
      -32000,
      `Failed to find documents: ${error.message}`
    );
  }
}

/**
 * Create operation handlers
 */
async function handleCreatePerson(request: McpRequest): Promise<McpResponse> {
  try {
    // Validate parameters
    const result = CreatePersonParamsSchema.safeParse(request.params);
    if (!result.success) {
      return createErrorResponse(
        request.id,
        -32602,
        `Invalid params: ${result.error.message}`
      );
    }

    // Call the API
    const person = await createPerson(result.data.name, result.data.email);
    return createSuccessResponse(request.id, person);
  } catch (error: any) {
    return createErrorResponse(
      request.id,
      -32000,
      `Failed to create person: ${error.message}`
    );
  }
}

async function handleCreateIssue(request: McpRequest): Promise<McpResponse> {
  try {
    // Validate parameters
    const result = CreateIssueParamsSchema.safeParse(request.params);
    if (!result.success) {
      return createErrorResponse(
        request.id,
        -32602,
        `Invalid params: ${result.error.message}`
      );
    }

    // Call the API
    const issue = await createIssue(
      result.data.projectId,
      result.data.title,
      result.data.description,
      result.data.priority,
      result.data.dueDate
    );
    return createSuccessResponse(request.id, issue);
  } catch (error: any) {
    return createErrorResponse(
      request.id,
      -32000,
      `Failed to create issue: ${error.message}`
    );
  }
}

async function handleCreateMilestone(request: McpRequest): Promise<McpResponse> {
  try {
    // Validate parameters
    const result = CreateMilestoneParamsSchema.safeParse(request.params);
    if (!result.success) {
      return createErrorResponse(
        request.id,
        -32602,
        `Invalid params: ${result.error.message}`
      );
    }

    // Call the API
    const milestone = await createMilestone(
      result.data.projectId,
      result.data.name,
      result.data.dueDate,
      result.data.issueIds
    );
    return createSuccessResponse(request.id, milestone);
  } catch (error: any) {
    return createErrorResponse(
      request.id,
      -32000,
      `Failed to create milestone: ${error.message}`
    );
  }
}

async function handleCreateDocument(request: McpRequest): Promise<McpResponse> {
  try {
    // Validate parameters
    const result = CreateDocumentParamsSchema.safeParse(request.params);
    if (!result.success) {
      return createErrorResponse(
        request.id,
        -32602,
        `Invalid params: ${result.error.message}`
      );
    }

    // Call the API
    const document = await createDocument(
      result.data.teamspaceId,
      result.data.name,
      result.data.content,
      result.data.projectIds
    );
    return createSuccessResponse(request.id, document);
  } catch (error: any) {
    return createErrorResponse(
      request.id,
      -32000,
      `Failed to create document: ${error.message}`
    );
  }
}

/**
 * Helper functions for creating MCP responses
 */
function createSuccessResponse(id: string | number, result: any): McpResponse {
  return {
    jsonrpc: '2.0',
    id,
    result
  };
}

function createErrorResponse(id: string | number, code: number, message: string, data?: any): McpResponse {
  return {
    jsonrpc: '2.0',
    id,
    error: {
      code,
      message,
      data
    }
  };
}
