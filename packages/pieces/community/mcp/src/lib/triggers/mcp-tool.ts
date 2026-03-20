import {
    createTrigger,
    Property,
    TriggerStrategy,
  } from '@activepieces/pieces-framework';
import { isNil, McpProperty, McpPropertyType } from '@activepieces/shared';


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
    const rawPayload = context.payload as Record<string, unknown>;
    const body = rawPayload['body'];
    const headers = rawPayload['headers'];
    const isTriggerPayloadEnvelope = typeof body === 'object' && body !== null && !Array.isArray(body)
      && typeof headers === 'object' && headers !== null && !Array.isArray(headers)
      && 'queryParams' in rawPayload;
    const payload = isTriggerPayloadEnvelope
      ? body as Record<string, unknown>
      : rawPayload;
    const inputSchema = context.propsValue.inputSchema as McpProperty[] | undefined;

    if (inputSchema) {
      const missingFields: string[] = [];
      for (const param of inputSchema) {
        if (param.required && isNil(payload[param.name])) {
          missingFields.push(param.name);
        }
      }
      if (missingFields.length > 0) {
        throw new Error(`Missing required parameters: ${missingFields.join(', ')}`);
      }
    }

    return [payload];
  },
  async test(context) {
    const inputSchema = context.propsValue.inputSchema as McpProperty[] | undefined;
    if (!inputSchema || inputSchema.length === 0) {
      return [{}];
    }
    const sampleData: Record<string, unknown> = {};
    for (const param of inputSchema) {
      sampleData[param.name] = SAMPLE_VALUES[param.type] ?? `sample ${param.name}`;
    }
    return [sampleData];
  },
});

const SAMPLE_VALUES: Record<string, unknown> = {
  [McpPropertyType.TEXT]: 'sample text',
  [McpPropertyType.NUMBER]: 0,
  [McpPropertyType.BOOLEAN]: false,
  [McpPropertyType.DATE]: '2025-01-01T00:00:00.000Z',
  [McpPropertyType.ARRAY]: [],
  [McpPropertyType.OBJECT]: {},
};