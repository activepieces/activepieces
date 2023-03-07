import { createAction, Property } from "@activepieces/framework";

export const readConnection = createAction({
  name: 'read_connection',
  displayName: 'Read Connection',
  description: 'Fetch connection by name',
  props: {
    connection_name: Property.ShortText({
      displayName: 'Connection Name',
      description: undefined,
      required: true,
    })
  },
  async run(ctx) {
    return await ctx.connections.get(ctx.propsValue.connection_name);
  },
});


