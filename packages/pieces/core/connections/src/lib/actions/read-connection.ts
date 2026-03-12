import { Property, createAction } from '@activepieces/pieces-framework';
import { isNil } from '@activepieces/shared';

const markdown = `
**Advanced Piece**
<br>
Use this piece if you are unsure which connection to use beforehand, such as when the connection external ID is sent through a webhook message.

**Notes:**
- You can retrieve the external ID from the connection settings page by hovering over the connection name.
- Use this action to retrieve connection values by their external IDs from this project.
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
      displayName: 'Connection External ID',
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
