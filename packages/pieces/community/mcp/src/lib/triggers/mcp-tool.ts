import {
    createTrigger,
    Property,
    TriggerStrategy,
  } from '@activepieces/pieces-framework';
import { isNil } from '@activepieces/pieces-framework';
import { McpProperty, McpPropertyType } from '@activepieces/pieces-framework';


export const mcpTool = createTrigger({
  name: 'mcp_tool',
  classification: 'READ',
  displayName: 'MCP Tool',
  description: 'Creates a tool that MCP clients can call to execute this flow',
  aiMetadata: {
    description: 'Fires when an MCP client such as Claude Desktop, Cursor, or Windsurf calls the tool that this flow publishes on the hosted MCP server, carrying the arguments the client supplied for the parameters declared on the trigger. The configured name and description are what the client sees when it picks the tool, any parameter marked required must be present or the call errors, and turning on Wait for Response holds the client until a Reply to MCP Client action returns a result.',
  },
  propertyGroups: [
    {
      key: 'tool',
      display: 'section',
      label: 'Tool',
      icon: 'code',
      props: ['toolName', 'toolDescription', 'returnsResponse'],
    },
    {
      key: 'inputs',
      display: 'section',
      label: 'Inputs',
      icon: 'sliders',
      props: ['inputSchema'],
    },
  ],
  props: {
    toolName: Property.ShortText({
      displayName: 'Name',
      description: 'The name AI clients like Claude or Cursor call this tool by.',
      placeholder: 'get_weather',
      required: true,
    }),
    toolDescription: Property.LongText({
      displayName: 'Description',
      description: 'Tells the AI client what the tool does and when to use it.',
      placeholder: 'Gets the current weather for a city.',
      required: true,
    }),
    inputSchema: Property.Array({
      displayName: 'Parameters',
      description: 'Values the AI client fills in when it calls this tool.',
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
      description: 'Hold the client until a Reply to MCP Client step answers.',
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