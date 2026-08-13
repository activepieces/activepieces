import { Property, createAction } from '@activepieces/pieces-framework';
import { isNil } from '@activepieces/pieces-framework';

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
  audience: 'both',
  name: 'read_connection',
  displayName: 'Read Connection',
  description: 'Fetch connection by name',
  aiMetadata: { description: 'Looks up a stored app connection in the current project by its external ID, so a flow can resolve credentials at runtime instead of binding one fixed connection at build time (for example when the external ID arrives in a webhook payload). When the connection is known up front, configure the target piece action with its own auth instead. Requires the exact external ID and throws if no connection matches; read-only and idempotent.', idempotent: true },
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
