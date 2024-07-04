export interface OpenAPISpec {
  paths: Record<string, Record<string, any>>;
  servers: { url: string }[];
}

export interface AuthDetails {
  displayName: string;
  description: string;
  authUrl?: string;
  tokenUrl?: string;
  required: boolean;
  scope?: string[];
}

export interface Action {
  endpoint: string;
  method: string;
  operationId: string;
  summary: string;
  description: string;
  parameters: {
    name: string;
    description: string;
    required: boolean;
  }[];
  requestBody?: {
    properties: Record<string, { type: string; description: string }>;
    required: string[];
  };
}
