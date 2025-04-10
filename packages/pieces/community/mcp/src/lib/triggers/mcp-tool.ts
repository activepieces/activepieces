import {
    createTrigger,
    Property,
    TriggerStrategy,
  } from '@activepieces/pieces-framework';
import { MCPProperyType } from '@activepieces/shared';


  export const mcpTool = createTrigger({
    name: 'mcp_tool',
    displayName: 'MCP Tool',
    description: 'run a flow in MCP',
    props: {
      toolName: Property.ShortText({
        displayName: 'Tool Name',
        description: 'The name of the tool',
        required: true,
      }),
      toolDescription: Property.LongText({
        displayName: 'Tool Description',
        description: 'The description of the tool',
        required: true,
      }),
      inputSchema: Property.Array({
        displayName: 'Parameters',
        description: 'The parameters for the tool',
        required: true,
        properties: {
          name: Property.ShortText({
            displayName: 'Name',
            required: true,
          }),
          type: Property.StaticDropdown({
            displayName: 'Type',
            required: true,
            defaultValue: MCPProperyType.TEXT,
            options: {
              options: Object.values(MCPProperyType).map((type) => ({
                value: type,
                label: type,
              })),
            },
          }),
          required: Property.Checkbox({
            displayName: 'Required',
            required: true,
            defaultValue: true,
          }),
        },
      }),
      returnsResponse: Property.Checkbox({
        displayName: 'Returns Response',
        description: 'Whether the tool returns a response',
        defaultValue: true,
        required: true,
      }),
    },
    type: TriggerStrategy.WEBHOOK,
    sampleData: null,
    async onEnable() {
      // ignore
    },
    async onDisable() {
      // ignore
    },
    async run(context) {
      return [context.payload];
    },
  });
  
  