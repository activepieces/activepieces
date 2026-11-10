import { Property, createAction } from '@activepieces/pieces-framework';
import { isNil } from '@activepieces/pieces-framework';

const markdown = `
Use this step when the flow only learns which connection to use while it runs, for example from a webhook.

It returns that connection's credentials. To use them in a later step, turn on **Dynamic value** on that step's connection field and insert this step's output.
`;

export const readConnection = createAction({
  audience: 'both',
  name: 'read_connection',
  classification: 'READ',
  displayName: 'Read Connection',
  description: "Get a connection's credentials by its external ID",
  aiMetadata: { description: 'Looks up a stored app connection in the current project by its external ID, so a flow can resolve credentials at runtime instead of binding one fixed connection at build time (for example when the external ID arrives in a webhook payload). When the connection is known up front, configure the target piece action with its own auth instead. Requires the exact external ID and throws if no connection matches; read-only and idempotent.', idempotent: true },
  props: {
    info: Property.MarkDown({
      value: markdown,
    }),
    connection_name: Property.ShortText({
      displayName: 'Connection External ID',
      description: 'Hover the app icon on the Connections page to copy it.',
      placeholder: '5Ohqs3kUGRvJy2V0wPZmT',
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
