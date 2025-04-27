import { z } from 'zod';

// Huly Types
export interface Person {
  id: string;
  name: string;
  channels?: CommunicationChannel[];
}

export interface CommunicationChannel {
  type: 'email' | 'phone' | 'linkedin';
  value: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
}

export interface Issue {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  priority?: 'low' | 'medium' | 'high';
  dueDate?: string;
  assigneeId?: string;
  status?: 'open' | 'in-progress' | 'resolved' | 'closed';
  lastModified: string;
}

export interface Milestone {
  id: string;
  projectId: string;
  name: string;
  dueDate?: string;
  issues?: string[]; // issue IDs
}

export interface Document {
  id: string;
  teamspaceId: string;
  name: string;
  content: string;
  projectIds?: string[];
}

// MCP Types
export const McpRequestSchema = z.object({
  jsonrpc: z.literal('2.0'),
  id: z.union([z.string(), z.number()]),
  method: z.string(),
  params: z.record(z.any()).optional(),
});

export type McpRequest = z.infer<typeof McpRequestSchema>;

export interface McpResponse {
  jsonrpc: '2.0';
  id: string | number;
  result?: any;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
}

// WebSocket Connection Types
export interface HulyWebSocketConnection {
  isConnected: () => boolean;  // Changed from boolean to () => boolean
  connect: () => Promise<void>;
  disconnect: () => void;
  send: (message: any) => Promise<any>;
}

// Huly API Schema Types
export const FindPersonParamsSchema = z.object({
  query: z.string().optional(),
});

export const FindProjectParamsSchema = z.object({
  id: z.string().optional(),
  name: z.string().optional(),
});

export const FindIssueParamsSchema = z.object({
  projectId: z.string(),
});

export const FindDocumentParamsSchema = z.object({
  teamspaceId: z.string(),
  name: z.string().optional(),
});

export const CreatePersonParamsSchema = z.object({
  name: z.string(),
  email: z.string().email(),
});

export const CreateIssueParamsSchema = z.object({
  projectId: z.string(),
  title: z.string(),
  description: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  dueDate: z.string().optional(),
});

export const CreateMilestoneParamsSchema = z.object({
  projectId: z.string(),
  name: z.string(),
  dueDate: z.string().optional(),
  issueIds: z.array(z.string()).optional(),
});

export const CreateDocumentParamsSchema = z.object({
  teamspaceId: z.string(),
  name: z.string(),
  content: z.string(),
  projectIds: z.array(z.string()).optional(),
});