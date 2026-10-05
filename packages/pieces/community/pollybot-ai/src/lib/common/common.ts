export const baseUrl = 'https://pollybot.app/api/v1';

export const leadStatusOptions = {
  NEW: 'NEW',
  CONTACTED: 'CONTACTED',
  QUALIFIED: 'QUALIFIED',
  NEGOTIATING: 'NEGOTIATING',
  CONVERTED: 'CONVERTED',
  LOST: 'LOST',
  UNRESPONSIVE: 'UNRESPONSIVE',
};

export const leadPriorityOptions = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  URGENT: 'URGENT',
};

export const preferredMethodOptions = {
  email: 'email',
  phone: 'phone',
  discord: 'discord',
};

export const urgencyOptions = {
  low: 'low',
  medium: 'medium',
  high: 'high',
};

// Helper to format error messages
export function formatError(e: unknown): string {
  const error = e as {
    response?: {
      status?: number;
      body?: {
        error?: string;
        code?: string;
        details?: unknown;
      };
    };
    message?: string;
  };

  const status = error.response?.status;
  const errorData = error.response?.body || {};
  const message = errorData.error || error.message || 'Unknown Error';
  const code = errorData.code ? ` (${errorData.code})` : '';
  const details = errorData.details ? ` Details: ${JSON.stringify(errorData.details)}` : '';

  return `Error [${status}]${code}: ${message}.${details}`;
}
