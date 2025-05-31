// Common types for Huly MCP operations

export interface HulyPerson {
  _id: string;
  name: string;
  email?: string;
  avatarUrl?: string;
  channels?: HulyChannel[];
}

export interface HulyChannel {
  type: 'email' | 'phone' | 'linkedin' | 'telegram' | 'other';
  value: string;
}

export interface HulyProject {
  _id: string;
  name: string;
  description?: string;
  identifier: string;
  state?: 'active' | 'completed' | 'archived';
}

export interface HulyIssue {
  _id: string;
  title: string;
  description?: string;
  number: number;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: string;
  assignee?: string;
  dueDate?: Date;
  project: string;
  modifiedOn: Date;
}

export interface HulyDocument {
  _id: string;
  name: string;
  content?: string;
  space: string;
  teamspace?: string;
  modifiedOn: Date;
}

export interface HulyMilestone {
  _id: string;
  title: string;
  description?: string;
  dueDate?: Date;
  project: string;
  status: 'open' | 'closed';
}

// MCP Response types
export interface McpSearchResult<T> {
  items: T[];
  total: number;
  hasMore: boolean;
}

export interface McpCreateResult<TData = unknown> {
  _id: string;
  success: boolean;
  message?: string;
  data?: TData;
}
