import {
    createTrigger,
    Property,
    TriggerStrategy,
  } from '@activepieces/pieces-framework';
import { MCPProperyType } from '@activepieces/shared';


  export const mcpTool = createTrigger({
    name: 'mcp_tool',
    displayName: 'MCP Tool',
    description: 'Creates a tool that MCP clients can call to execute this flow',
    props: {
      toolName: Property.ShortText({
        displayName: 'Name',
        description: 'Used to call this tool from MCP clients like Claude Desktop, Cursor, or Windsurf',
        required: true,
      }),
      toolDescription: Property.LongText({
        displayName: 'Description', 
        description: 'Used to describe what this tool does and when to use it',
        required: true,
      }),
      inputSchema: Property.Array({
        displayName: 'Parameters',
        description: 'Define the input parameters that this tool accepts. Parameters will be shown to users when calling the tool.',
        required: true,
        defaultValue: [
          {
            name: '',
            type: MCPProperyType.TEXT,
            required: true,
          },
        ],
        properties: {
          name: Property.ShortText({
            displayName: 'Name',
            required: true,
          }),
          description: Property.LongText({
            displayName: 'Description',
            required: false,
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
        displayName: 'Reply to MCP Client',
        description: 'Enable this if you want to wait for results and reply to the MCP client that called the tool.',
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
  
  