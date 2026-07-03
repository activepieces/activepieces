import { createAction, Property } from '@activepieces/pieces-framework';
import { dynamodbAuth } from '../auth';
import {
  createDynamoDBClient,
  fromAttributeMap,
  parseExpressionValues,
  toAttributeMap,
  UpdateItemCommand,
} from '../common';

export const updateItemAction = createAction({
  auth: dynamodbAuth,
  name: 'update_item',
  displayName: 'Update Item',
  description: 'Update one DynamoDB item using an update expression.',
  props: {
    tableName: Property.ShortText({ displayName: 'Table Name', required: true }),
    key: Property.Json({ displayName: 'Key', required: true }),
    updateExpression: Property.LongText({
      displayName: 'Update Expression',
      description: 'For example SET #name = :name.',
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
    conditionExpression: Property.LongText({
      displayName: 'Condition Expression',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const client = createDynamoDBClient(auth);
    const out = await client.send(
      new UpdateItemCommand({
        TableName: propsValue.tableName,
        Key: toAttributeMap(propsValue.key, 'Key'),
        UpdateExpression: propsValue.updateExpression,
        ExpressionAttributeNames:
          propsValue.expressionAttributeNames &&
          Object.keys(propsValue.expressionAttributeNames as object).length > 0
            ? (propsValue.expressionAttributeNames as Record<string, string>)
            : undefined,
        ExpressionAttributeValues: parseExpressionValues(propsValue.expressionAttributeValues),
        ConditionExpression: propsValue.conditionExpression,
        ReturnValues: 'ALL_NEW',
      }),
    );
    return { attributes: fromAttributeMap(out.Attributes) };
  },
});
