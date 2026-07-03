import { createAction, Property } from '@activepieces/pieces-framework';
import { dynamodbAuth } from '../auth';
import {
  createDynamoDBClient,
  clampDynamoDBQueryLimit,
  DEFAULT_DYNAMODB_QUERY_LIMIT,
  enforceDynamoDBOutputLimit,
  fromAttributeMap,
  MAX_DYNAMODB_QUERY_LIMIT,
  parseExpressionValues,
  QueryCommand,
  toAttributeMap,
} from '../common';

const queryLimitProperty = Object.assign(
  Property.Number({
    displayName: 'Limit',
    description: `Defaults to ${DEFAULT_DYNAMODB_QUERY_LIMIT}. Values above ${MAX_DYNAMODB_QUERY_LIMIT} are clamped.`,
    required: false,
    defaultValue: DEFAULT_DYNAMODB_QUERY_LIMIT,
  }),
  { minimum: 1, maximum: MAX_DYNAMODB_QUERY_LIMIT },
);

export const queryItemsAction = createAction({
  auth: dynamodbAuth,
  name: 'query_items',
  displayName: 'Query Items',
  description: 'Query items by partition key and optional sort-key expression.',
  props: {
    tableName: Property.ShortText({ displayName: 'Table Name', required: true }),
    keyConditionExpression: Property.LongText({
      displayName: 'Key Condition Expression',
      required: true,
    }),
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
    indexName: Property.ShortText({ displayName: 'Index Name', required: false }),
    filterExpression: Property.LongText({ displayName: 'Filter Expression', required: false }),
    limit: queryLimitProperty,
    exclusiveStartKey: Property.Json({
      displayName: 'Exclusive Start Key',
      description: 'Use the lastEvaluatedKey returned by the previous page to fetch the next page.',
      required: false,
      defaultValue: {},
    }),
  },
  async run({ auth, propsValue }) {
    const client = createDynamoDBClient(auth);
    const limit = clampDynamoDBQueryLimit(propsValue.limit);
    const out = await client.send(
      new QueryCommand({
        TableName: propsValue.tableName,
        IndexName: propsValue.indexName,
        KeyConditionExpression: propsValue.keyConditionExpression,
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
    enforceDynamoDBOutputLimit(result, 'query_items');
    return result;
  },
});
