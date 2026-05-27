import axios, { AxiosError, AxiosInstance } from 'axios';

export interface McpResponse<T> {
  jsonrpc: string;
  id: string;
  result?: T;
  error?: { code: number; message: string };
}

export function createClient(baseUrl: string, apiKey: string): AxiosInstance {
  return axios.create({
    baseURL: baseUrl,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    timeout: 30000,
  });
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryableStatus(status?: number): boolean {
  return status === 408 || status === 429 || (typeof status === 'number' && status >= 500);
}

function toAckpostError(error: unknown): Error {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<{ error?: { message?: string } }>;
    const status = axiosError.response?.status;
    const responseMessage = axiosError.response?.data?.error?.message;
    if (typeof status === 'number') {
      return new Error(`AckPost request failed (${status}): ${responseMessage ?? axiosError.message}`);
    }
    return new Error(`AckPost request failed: ${axiosError.message}`);
  }
  return error instanceof Error ? error : new Error('AckPost request failed with an unknown error');
}

export async function callMcp<T>(
  client: AxiosInstance,
  method: string,
  params: Record<string, unknown> = {}
): Promise<T> {
  const maxAttempts = 3;
  let attempt = 0;
  let lastError: Error | null = null;

  while (attempt < maxAttempts) {
    attempt += 1;
    try {
      const response = await client.post<McpResponse<T>>('', {
        jsonrpc: '2.0',
        id: Date.now().toString(),
        method,
        params,
      });

      if (response.data.error) {
        throw new Error(`AckPost error: ${response.data.error.message}`);
      }

      return response.data.result as T;
    } catch (error) {
      const normalizedError = toAckpostError(error);
      lastError = normalizedError;

      if (axios.isAxiosError(error) && isRetryableStatus(error.response?.status) && attempt < maxAttempts) {
        await sleep(250 * Math.pow(2, attempt - 1));
        continue;
      }

      throw normalizedError;
    }
  }

  throw lastError ?? new Error('AckPost request failed after retries');
}

export const MCP_BASE_URL = 'https://ackpost.com/api/ackpost/mcp';
