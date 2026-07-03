import { createAction, Property } from '@activepieces/pieces-framework';
import { dynamodbAuth } from '../auth';
import { createDynamoDBClient, PutItemCommand, toAttributeMap } from '../common';

export const putItemAction = createAction({
  auth: dynamodbAuth,
  name: 'put_item',
  displayName: 'Put Item',
  description: 'Create or replace one DynamoDB item.',
  props: {
    tableName: Property.ShortText({ displayName: 'Table Name', required: true }),
    item: Property.Json({ displayName: 'Item', required: true }),
    conditionExpression: Property.LongText({
      displayName: 'Condition Expression',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const client = createDynamoDBClient(auth);
    const out = await client.send(
      new PutItemCommand({
        TableName: propsValue.tableName,
        Item: toAttributeMap(propsValue.item, 'Item'),
        ConditionExpression: propsValue.conditionExpression,
      }),
    );
    return {
      consumedCapacity: out.ConsumedCapacity,
      itemCollectionMetrics: out.ItemCollectionMetrics,
    };
  },
});
