import { createAction, Property } from '@activepieces/pieces-framework';
import { dynamodbAuth } from '../auth';
import { createDynamoDBClient, fromAttributeMap, GetItemCommand, toAttributeMap } from '../common';

export const getItemAction = createAction({
  auth: dynamodbAuth,
  name: 'get_item',
  displayName: 'Get Item',
  description: 'Read one item by primary key.',
  props: {
    tableName: Property.ShortText({ displayName: 'Table Name', required: true }),
    key: Property.Json({
      displayName: 'Key',
      description: 'Primary key object, for example {"pk":"user#1","sk":"profile"}.',
      required: true,
    }),
    consistentRead: Property.Checkbox({
      displayName: 'Consistent Read',
      required: false,
      defaultValue: false,
    }),
  },
  async run({ auth, propsValue }) {
    const client = createDynamoDBClient(auth);
    const out = await client.send(
      new GetItemCommand({
        TableName: propsValue.tableName,
        Key: toAttributeMap(propsValue.key, 'Key'),
        ConsistentRead: propsValue.consistentRead,
      }),
    );
    return { item: fromAttributeMap(out.Item) };
  },
});
