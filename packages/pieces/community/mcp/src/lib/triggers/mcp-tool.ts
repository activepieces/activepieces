import {
    createTrigger,
    Property,
    TriggerStrategy,
  } from '@activepieces/pieces-framework';
import { McpPropertyType } from '@activepieces/shared';


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
      required: false,
      defaultValue: [
        {
          name: '',
          type: McpPropertyType.TEXT,
          required: true,
          description: '',
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
          defaultValue: McpPropertyType.TEXT,
          options: {
            options: Object.values(McpPropertyType).map((type) => ({
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
      displayName: 'Wait for Response',
      description: 'Keep the MCP client waiting until it receives a response via the Reply to MCP Client action',
      defaultValue: false,
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
  async test() {
    return [{}];
  },
});