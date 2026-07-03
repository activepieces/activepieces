import { createAction, Property } from '@activepieces/pieces-framework';
import { dynamodbAuth } from '../auth';
import {
  createDynamoDBClient,
  clampDynamoDBScanLimit,
  DEFAULT_DYNAMODB_SCAN_LIMIT,
  enforceDynamoDBOutputLimit,
  fromAttributeMap,
  MAX_DYNAMODB_SCAN_LIMIT,
  parseExpressionValues,
  ScanCommand,
  toAttributeMap,
} from '../common';

const scanLimitProperty = Object.assign(
  Property.Number({
    displayName: 'Limit',
    description: `Defaults to ${DEFAULT_DYNAMODB_SCAN_LIMIT}. Values above ${MAX_DYNAMODB_SCAN_LIMIT} are clamped.`,
    required: false,
    defaultValue: DEFAULT_DYNAMODB_SCAN_LIMIT,
  }),
  { minimum: 1, maximum: MAX_DYNAMODB_SCAN_LIMIT },
);

export const scanItemsAction = createAction({
  auth: dynamodbAuth,
  name: 'scan_items',
  displayName: 'Scan Items',
  description: 'Scan a DynamoDB table. Prefer Query Items for production workloads.',
  props: {
    tableName: Property.ShortText({ displayName: 'Table Name', required: true }),
    filterExpression: Property.LongText({ displayName: 'Filter Expression', required: false }),
    expressionAttributeNames: Property.Json({
      displayName: 'Expression Attribute Names',
      required: false,
      defaultValue: {},
    }),
    expressionAttributeValues: Property.Json({
      displayName: 'Expression Attribute Values',
      required: false,
      defaultValue: {},
    }),
    limit: scanLimitProperty,
    exclusiveStartKey: Property.Json({
      displayName: 'Exclusive Start Key',
      description: 'Use the lastEvaluatedKey returned by the previous page to fetch the next page.',
      required: false,
      defaultValue: {},
    }),
  },
  async run({ auth, propsValue }) {
    const client = createDynamoDBClient(auth);
    const limit = clampDynamoDBScanLimit(propsValue.limit);
    const out = await client.send(
      new ScanCommand({
        TableName: propsValue.tableName,
        FilterExpression: propsValue.filterExpression,
        ExpressionAttributeNames:
          propsValue.expressionAttributeNames &&
          Object.keys(propsValue.expressionAttributeNames as object).length > 0
            ? (propsValue.expressionAttributeNames as Record<string, string>)
            : undefined,
        ExpressionAttributeValues: parseExpressionValues(propsValue.expressionAttributeValues),
        Limit: limit,
        ExclusiveStartKey:
          propsValue.exclusiveStartKey &&
          Object.keys(propsValue.exclusiveStartKey as object).length > 0
            ? toAttributeMap(propsValue.exclusiveStartKey, 'Exclusive start key')
            : undefined,
      }),
    );
    const result = {
      items: (out.Items ?? []).map(fromAttributeMap),
      count: out.Count ?? 0,
      scannedCount: out.ScannedCount ?? 0,
      lastEvaluatedKey: fromAttributeMap(out.LastEvaluatedKey),
      limit,
      hasMore: Boolean(out.LastEvaluatedKey),
    };
    enforceDynamoDBOutputLimit(result, 'scan_items');
    return result;
  },
});
