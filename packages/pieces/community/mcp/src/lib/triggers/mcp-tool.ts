import {
    createTrigger,
    Property,
    TriggerStrategy,
    DynamicPropsValue,
  } from '@activepieces/pieces-framework';
import { MarkdownVariant, McpPropertyType, ExecutionType, PauseType } from '@activepieces/shared';

// Define a type for the parameter schema item
export interface ParameterSchemaItem {
  name: string;
  type: McpPropertyType;
  required: boolean;
  description?: string;
}

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
    showSampleData: Property.Checkbox({
      displayName: 'Add Sample Data',
      description: 'Enable to add sample data for testing this tool, this data should match the parameters defined above',
      required: false, 
      defaultValue: false,
    }),
    sampleDataSection: Property.DynamicProperties({
      displayName: 'Sample Data',
      description: 'Define sample values for testing',
      required: false,
      refreshers: ['showSampleData', 'inputSchema'],
      props: async (propsValue) => {
        const showSampleData = propsValue['showSampleData'];
        const fields: DynamicPropsValue = {};
        
        if (!showSampleData) {
          return {};
        }
        
        const inputSchema = propsValue['inputSchema'] as ParameterSchemaItem[] || [];
        
        for (const param of inputSchema) {
          if (!param.name) continue;
          
          const propertyConfig = {
            displayName: param.name,
            required: param.required,
          };
          
          switch (param.type) {
            case McpPropertyType.TEXT:
              fields[param.name] = Property.LongText(propertyConfig);
              break;
            case McpPropertyType.NUMBER:
              fields[param.name] = Property.Number(propertyConfig);
              break;
            case McpPropertyType.BOOLEAN:
              fields[param.name] = Property.Checkbox({
                ...propertyConfig,
                defaultValue: false,
              });
              break;
            case McpPropertyType.DATE:
              fields[param.name] = Property.DateTime(propertyConfig);
              break;
            case McpPropertyType.ARRAY:
              fields[param.name] = Property.Json({
                ...propertyConfig,
              });
              break;
            case McpPropertyType.OBJECT:
              fields[param.name] = Property.Json({
                ...propertyConfig,
              });
              break;
            default:
              fields[param.name] = Property.LongText(propertyConfig);
          }
        }
        
        return fields;
      },
    }),
  },
  type: TriggerStrategy.WEBHOOK,
  sampleData: {},
  async onEnable() {
    // ignore
  },
  async onDisable() {
    // ignore
  },
  async run(context) {
    return [context.payload];
  },
  async test(context) {
    if (context.propsValue.showSampleData && context.propsValue.sampleDataSection) {
      if (Object.keys(context.propsValue.sampleDataSection).length > 0) {
        return [context.propsValue.sampleDataSection];
      }
    }
    
    return [{}];
  },
});