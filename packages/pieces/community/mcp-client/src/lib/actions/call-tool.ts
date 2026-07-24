import {
  createAction,
  InputProperty,
  InputPropertyMap,
  Property,
} from '@activepieces/pieces-framework';
import { mcpClientAuth } from '../auth';
import { mcpClient, McpToolInfo } from '../common/client';

export const callTool = createAction({
  auth: mcpClientAuth,
  name: 'call-tool',
  displayName: 'Call Tool',
  description: 'Invoke a specific tool on an external MCP server and return its result.',
  props: {
    tool: Property.Dropdown<string, true, typeof mcpClientAuth>({
      auth: mcpClientAuth,
      displayName: 'Tool',
      description: 'The tool to call. The list is loaded from the MCP server.',
      required: true,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) {
          return { disabled: true, placeholder: 'Connect an MCP server first', options: [] };
        }
        try {
          const tools = await mcpClient.listTools(auth.props);
          return { options: tools.map((tool) => ({ label: tool.name, value: tool.name })) };
        } catch (error) {
          return {
            disabled: true,
            placeholder: `Failed to load tools: ${error instanceof Error ? error.message : String(error)}`,
            options: [],
          };
        }
      },
    }),
    args: Property.DynamicProperties({
      auth: mcpClientAuth,
      displayName: 'Tool Inputs',
      required: false,
      refreshers: ['tool'],
      props: async ({ auth, tool }): Promise<InputPropertyMap> => {
        if (!auth || !tool) {
          return {};
        }
        try {
          const tools = await mcpClient.listTools(auth.props);
          const selected = tools.find((candidate) => candidate.name === tool);
          return schemaToProps(selected?.inputSchema);
        } catch {
          return {};
        }
      },
    }),
  },
  async run(context) {
    const { tool, args } = context.propsValue;
    const client = await mcpClient.connect(context.auth.props);
    try {
      const result = await client.callTool({ name: tool, arguments: args ?? {} });
      if (isErrorResult(result)) {
        throw new Error(extractText(result) || `MCP tool "${tool}" returned an error.`);
      }
      return result;
    } finally {
      await client.close();
    }
  },
});

function schemaToProps(schema: McpToolInfo['inputSchema'] | undefined): InputPropertyMap {
  // MCP input schemas are untyped JSON Schema objects; assert the shape at this boundary.
  const properties = schema?.properties as Record<string, JsonSchemaProp> | undefined;
  if (!properties) {
    return {};
  }
  const required = new Set(Array.isArray(schema?.required) ? schema.required : []);
  return Object.fromEntries(
    Object.entries(properties).map(([name, definition]) => [
      name,
      toProperty({ name, def: definition, required: required.has(name) }),
    ]),
  );
}

function toProperty(params: {
  name: string;
  def: JsonSchemaProp;
  required: boolean;
}): InputProperty {
  const { name, def, required } = params;
  const description = typeof def.description === 'string' ? def.description : undefined;
  const type = Array.isArray(def.type) ? def.type.find((entry) => entry !== 'null') : def.type;

  if (Array.isArray(def.enum) && def.enum.length > 0) {
    return Property.StaticDropdown({
      displayName: name,
      description,
      required,
      options: { options: def.enum.map((value) => ({ label: String(value), value })) },
    });
  }

  switch (type) {
    case 'number':
    case 'integer':
      return Property.Number({ displayName: name, description, required });
    case 'boolean':
      return Property.Checkbox({ displayName: name, description, required });
    case 'string':
      return Property.ShortText({ displayName: name, description, required });
    default:
      return Property.Json({
        displayName: name,
        description: [description, '(JSON)'].filter(Boolean).join(' '),
        required,
      });
  }
}

function isErrorResult(result: unknown): boolean {
  return (
    typeof result === 'object' && result !== null && 'isError' in result && result.isError === true
  );
}

function extractText(result: unknown): string {
  if (typeof result !== 'object' || result === null || !('content' in result)) {
    return '';
  }
  const content = result.content;
  if (!Array.isArray(content)) {
    return '';
  }
  return content
    .filter(
      (block): block is { type: string; text: string } =>
        typeof block === 'object' &&
        block !== null &&
        block.type === 'text' &&
        typeof block.text === 'string',
    )
    .map((block) => block.text)
    .join('\n');
}

type JsonSchemaProp = {
  type?: string | string[];
  description?: string;
  enum?: unknown[];
};
