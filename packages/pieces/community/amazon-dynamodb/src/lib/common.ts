import {
  DeleteItemCommand,
  DescribeTableCommand,
  DynamoDBClient,
  GetItemCommand,
  ListTablesCommand,
  PutItemCommand,
  QueryCommand,
  ScanCommand,
  UpdateItemCommand,
  type AttributeValue,
  type DynamoDBClientConfig,
} from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';

export interface DynamoDBAuth {
  accessKeyId: string;
  secretAccessKey: string;
  sessionToken?: string;
  region: string;
}

export const DEFAULT_DYNAMODB_QUERY_LIMIT = 100;
export const MAX_DYNAMODB_QUERY_LIMIT = 500;
export const DEFAULT_DYNAMODB_SCAN_LIMIT = 50;
export const MAX_DYNAMODB_SCAN_LIMIT = 200;
export const DEFAULT_DYNAMODB_LIST_LIMIT = 100;
export const MAX_DYNAMODB_LIST_LIMIT = 100;
const MAX_DYNAMODB_OUTPUT_BYTES = 2 * 1024 * 1024;

export function createDynamoDBClient(rawAuth: unknown): DynamoDBClient {
  const auth = rawAuth as Partial<DynamoDBAuth>;
  if (!auth.accessKeyId || !auth.secretAccessKey || !auth.region) {
    throw new Error('DynamoDB requires accessKeyId, secretAccessKey, and region.');
  }

  const config: DynamoDBClientConfig = {
    region: auth.region,
    credentials: {
      accessKeyId: auth.accessKeyId,
      secretAccessKey: auth.secretAccessKey,
      ...(auth.sessionToken ? { sessionToken: auth.sessionToken } : {}),
    },
  };
  return new DynamoDBClient(config);
}

export function toAttributeMap(value: unknown, fieldName: string): Record<string, AttributeValue> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`${fieldName} must be a JSON object.`);
  }
  return marshall(value as Record<string, unknown>, {
    removeUndefinedValues: true,
    convertClassInstanceToMap: true,
  });
}

export function fromAttributeMap(
  value: Record<string, AttributeValue> | undefined,
): Record<string, unknown> | null {
  return value ? unmarshall(value) : null;
}

export function parseExpressionValues(value: unknown): Record<string, AttributeValue> | undefined {
  if (!value || (typeof value === 'object' && Object.keys(value as object).length === 0)) {
    return undefined;
  }
  return toAttributeMap(value, 'Expression attribute values');
}

function clampPositiveInt(value: unknown, defaultValue: number, maxValue: number): number {
  const raw = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(raw) || raw <= 0) return defaultValue;
  return Math.min(Math.floor(raw), maxValue);
}

export function clampDynamoDBQueryLimit(value: unknown): number {
  return clampPositiveInt(value, DEFAULT_DYNAMODB_QUERY_LIMIT, MAX_DYNAMODB_QUERY_LIMIT);
}

export function clampDynamoDBScanLimit(value: unknown): number {
  return clampPositiveInt(value, DEFAULT_DYNAMODB_SCAN_LIMIT, MAX_DYNAMODB_SCAN_LIMIT);
}

export function clampDynamoDBListLimit(value: unknown): number {
  return clampPositiveInt(value, DEFAULT_DYNAMODB_LIST_LIMIT, MAX_DYNAMODB_LIST_LIMIT);
}

export function enforceDynamoDBOutputLimit(output: unknown, actionName: string): void {
  const sizeBytes = Buffer.byteLength(JSON.stringify(output), 'utf8');
  if (sizeBytes > MAX_DYNAMODB_OUTPUT_BYTES) {
    throw new Error(
      `DynamoDB ${actionName} output exceeded ${MAX_DYNAMODB_OUTPUT_BYTES} bytes; reduce limit or project fewer attributes.`,
    );
  }
}

export {
  DeleteItemCommand,
  DescribeTableCommand,
  GetItemCommand,
  ListTablesCommand,
  PutItemCommand,
  QueryCommand,
  ScanCommand,
  UpdateItemCommand,
};
