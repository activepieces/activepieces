// No need to import HttpHeaders, we can use Record<string, string> instead

/**
 * Copy.ai API configuration
 */
export const copyAiConfig = {
  baseUrl: 'https://api.copy.ai/api',
  apiKeyHeaderName: 'x-copy-ai-api-key',
};

/**
 * Workflow run status types
 */
export enum WorkflowRunStatus {
  NEW = 'NEW',
  WAITING = 'WAITING',
  PROCESSING = 'PROCESSING',
  COMPLETE = 'COMPLETE',
  RETRYING = 'RETRYING',
  FAILED = 'FAILED',
}

/**
 * Webhook event types
 */
export enum WebhookEventType {
  WORKFLOW_RUN_STARTED = 'workflowRun.started',
  WORKFLOW_RUN_COMPLETED = 'workflowRun.completed',
  WORKFLOW_RUN_FAILED = 'workflowRun.failed',
  WORKFLOW_CREDIT_LIMIT_REACHED = 'workflowCreditLimit.reached',
}

/**
 * Response structure for workflow run
 */
export interface WorkflowRunResponse {
  status: string;
  data: {
    id: string;
    status: WorkflowRunStatus;
    input: Record<string, any>;
    output?: Record<string, any>;
    metadata?: Record<string, any>;
    createdAt: string;
    credits?: number;
  };
}

/**
 * Response structure for starting a workflow run
 */
export interface StartWorkflowRunResponse {
  status: string;
  data: {
    id: string;
  };
}

/**
 * Response structure for all workflow runs
 */
export interface AllWorkflowRunsResponse {
  status: string;
  data: {
    total: number;
    data: Array<{
      id: string;
      status: WorkflowRunStatus;
      input: Record<string, any>;
      output?: Record<string, any>;
      metadata?: Record<string, any>;
      createdAt: string;
      credits?: number;
    }>;
  };
}

/**
 * Webhook payload for workflow run completed event
 */
export interface WorkflowRunCompletedWebhookPayload {
  type: WebhookEventType.WORKFLOW_RUN_COMPLETED;
  workflowRunId: string;
  workflowId: string;
  result: Record<string, any>;
  metadata?: Record<string, any>;
  credits?: number;
}

/**
 * Response structure for webhook registration
 */
export interface WebhookRegistrationResponse {
  status: string;
  data: {
    id: string;
    url: string;
    eventType: WebhookEventType;
    workflowId?: string;
  };
}
