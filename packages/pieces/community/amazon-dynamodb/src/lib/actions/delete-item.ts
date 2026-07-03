import { createAction, Property } from '@activepieces/pieces-framework';
import { dynamodbAuth } from '../auth';
import {
  createDynamoDBClient,
  DeleteItemCommand,
  fromAttributeMap,
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
  },
  async run({ auth, propsValue }) {
    const client = createDynamoDBClient(auth);
    const out = await client.send(
      new DeleteItemCommand({
        TableName: propsValue.tableName,
        Key: toAttributeMap(propsValue.key, 'Key'),
        ConditionExpression: propsValue.conditionExpression,
        ReturnValues: 'ALL_OLD',
      }),
    );
    return { deletedItem: fromAttributeMap(out.Attributes) };
  },
});
