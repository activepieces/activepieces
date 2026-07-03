import { createAction, Property } from '@activepieces/pieces-framework';
import { dynamodbAuth } from '../auth';
import {
  createDynamoDBClient,
  DeleteItemCommand,
  fromAttributeMap,
  parseExpressionNames,
  parseExpressionValues,
  toAttributeMap,
} from '../common';

export const deleteItemAction = createAction({
  auth: dynamodbAuth,
  name: 'delete_item',
  displayName: 'Delete Item',
  description: 'Delete one DynamoDB item by primary key.',
  props: {
    tableName: Property.ShortText({ displayName: 'Table Name', required: true }),
    key: Property.Json({ displayName: 'Key', required: true }),
    conditionExpression: Property.LongText({
      displayName: 'Condition Expression',
      required: false,
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
  },
  async run({ auth, propsValue }) {
    const client = createDynamoDBClient(auth);
    const out = await client.send(
      new DeleteItemCommand({
        TableName: propsValue.tableName,
        Key: toAttributeMap(propsValue.key, 'Key'),
        ConditionExpression: propsValue.conditionExpression,
        ExpressionAttributeNames: parseExpressionNames(propsValue.expressionAttributeNames),
        ExpressionAttributeValues: parseExpressionValues(propsValue.expressionAttributeValues),
        ReturnValues: 'ALL_OLD',
      }),
    );
    return { deletedItem: fromAttributeMap(out.Attributes) };
  },
});
