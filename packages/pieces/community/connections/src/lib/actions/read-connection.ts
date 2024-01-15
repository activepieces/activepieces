import { Property, createAction } from '@activepieces/pieces-framework';

const markdown = `
**Advanced Piece**
<br>
Use this action to get connections dynamically by their names from this project.
<br>
Only use this piece if you're unsure which connection to use beforehand, like when the link name is sent through a webhook message.
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
    return await ctx.connections.get(ctx.propsValue.connection_name);
  },
});
