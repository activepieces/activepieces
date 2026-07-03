import { createAction, Property } from '@activepieces/pieces-framework';
import { dynamodbAuth } from '../auth';
import {
  clampDynamoDBListLimit,
  createDynamoDBClient,
  DEFAULT_DYNAMODB_LIST_LIMIT,
  enforceDynamoDBOutputLimit,
  ListTablesCommand,
  MAX_DYNAMODB_LIST_LIMIT,
} from '../common';

const listLimitProperty = Object.assign(
  Property.Number({
    displayName: 'Limit',
    description: `Defaults to ${DEFAULT_DYNAMODB_LIST_LIMIT}. Values above ${MAX_DYNAMODB_LIST_LIMIT} are clamped.`,
    required: false,
    defaultValue: DEFAULT_DYNAMODB_LIST_LIMIT,
  }),
  { minimum: 1, maximum: MAX_DYNAMODB_LIST_LIMIT },
);

export const listTablesAction = createAction({
  auth: dynamodbAuth,
  name: 'list_tables',
  displayName: 'List Tables',
  description: 'List DynamoDB table names.',
  props: {
    limit: listLimitProperty,
    exclusiveStartTableName: Property.ShortText({
      displayName: 'Exclusive Start Table Name',
      description:
        'Use the lastEvaluatedTableName returned by the previous page to fetch the next page.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const client = createDynamoDBClient(auth);
    const limit = clampDynamoDBListLimit(propsValue.limit);
    const out = await client.send(
      new ListTablesCommand({
        Limit: limit,
        ExclusiveStartTableName: propsValue.exclusiveStartTableName,
      }),
    );
    const result = {
      tableNames: out.TableNames ?? [],
      lastEvaluatedTableName: out.LastEvaluatedTableName,
      limit,
      hasMore: Boolean(out.LastEvaluatedTableName),
    };
    enforceDynamoDBOutputLimit(result, 'list_tables');
    return result;
  },
});
