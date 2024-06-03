import { Property, createAction } from '@activepieces/pieces-framework';
import { isNil } from 'lodash';

const markdown = `
**Advanced Piece**
<br>
Use this piece If you are unsure which connection to use beforehand, such as when the connection name is sent through a webhook message.

**Notes:**
- Use this action to retrieve connection values by their names from this project.
- After testing the step, you can use the dynamic value in the piece by clicking (X) and referring to this step.
`;

export const readConnection = createAction({
  name: 'read_connection',
  displayName: 'Read Connection',
  description: 'Fetch connection by name',
  props: {
    info: Property.MarkDown({
      value: markdown,
    }),
    connection_name: Property.ShortText({
      displayName: 'Connection Name',
      description: undefined,
      required: true,
    }),
  },
  async run(ctx) {
    const connection = await ctx.connections.get(ctx.propsValue.connection_name);
    if (isNil(connection)) {
      throw new Error(JSON.stringify({
        message: 'Connection not found',
        connectionName: ctx.propsValue.connection_name,
      }));
    }
    return connection;
  },
});
