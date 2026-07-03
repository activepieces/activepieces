import { createAction, Property } from '@activepieces/pieces-framework';
import { dynamodbAuth } from '../auth';
import { createDynamoDBClient, DescribeTableCommand } from '../common';

export const describeTableAction = createAction({
  auth: dynamodbAuth,
  name: 'describe_table',
  displayName: 'Describe Table',
  description: 'Return metadata for a DynamoDB table.',
  props: {
    tableName: Property.ShortText({
      displayName: 'Table Name',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const client = createDynamoDBClient(auth);
    const out = await client.send(new DescribeTableCommand({ TableName: propsValue.tableName }));
    return { table: out.Table };
  },
});
