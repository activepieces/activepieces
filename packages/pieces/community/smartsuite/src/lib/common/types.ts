import { DynamicPropsValue } from '@activepieces/pieces-framework';

export interface SmartSuiteField {
  id: string;
  name: string;
  type: string;
  required: boolean;
  system: boolean;
}

export interface SmartSuiteRecord {
  id: string;
  title: string;
  fields: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface SmartSuiteSolution {
  id: string;
  name: string;
  description?: string;
}

export interface SmartSuiteApp {
  id: string;
  name: string;
  description?: string;
}

export interface SmartSuiteWebhook {
  webhook_id: string;
  filter: {
    applications: {
      application_ids: string[];
    };
  };
  kinds: string[];
  locator: {
    account_id: string;
    solution_id: string;
  };
  notification_status: {
    enabled: {
      url: string;
    };
  };
}

export interface SmartSuiteWebhookEvent {
  webhookId: string;
  locator: {
    accountId: string;
    solutionId: string;
    applicationId?: string;
    recordId?: string;
  };
  kind: string;
  timestamp: string;
}

export interface SmartSuiteError {
  status: number;
  message: string;
  details?: Record<string, any>;
}

export interface SmartSuiteAuth {
  apiKey: string;
}

export interface SmartSuiteRecordFields extends DynamicPropsValue {
  [key: string]: any;
}

export interface SmartSuiteFileUpload {
  file: {
    data: Buffer;
    filename: string;
    mimetype: string;
  };
  fieldId: string;
  recordId: string;
}

export interface SmartSuiteSearchParams {
  limit?: number;
  sort?: {
    field: string;
    direction: 'asc' | 'desc';
  }[];
  filter?: Record<string, any>;
}

export interface SmartSuiteWebhookConfig {
  id: string;
  name: string;
  solutionId: string;
  tableIds: string[];
  events: SmartSuiteWebhookEventType[];
  url: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export interface SmartSuiteWebhookPayload {
  id: string;
  type: SmartSuiteWebhookEventType;
  data: {
    record: SmartSuiteRecord;
    solution: SmartSuiteSolution;
    table: SmartSuiteApp;
    user?: {
      id: string;
      email: string;
      name: string;
    };
  };
  timestamp: string;
}

export type SmartSuiteWebhookEventType = 
  | 'record.created'
  | 'record.updated'
  | 'record.deleted'
  | 'record.restored';

export interface SmartSuiteWebhookFilter {
  tables?: string[];
  events?: SmartSuiteWebhookEventType[];
  fields?: string[];
} 