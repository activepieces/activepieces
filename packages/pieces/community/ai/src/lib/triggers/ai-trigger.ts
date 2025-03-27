import {
  Property,
  TriggerStrategy,
  createTrigger,
} from '@activepieces/pieces-framework';
import {
  MarkdownVariant,
} from '@activepieces/shared';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';

const infoMarkdown = `
This trigger allows your flow to be called by AI agents through the MCP server.
Define the input schema to specify what parameters the AI agent should provide.
`;

export const aiTrigger = createTrigger({
  name: 'ai_trigger',
  displayName: 'AI Tool',
  description: 'Expose your flow as an AI tool for the MCP server',
  props: {
    info: Property.MarkDown({
      value: infoMarkdown,
      variant: MarkdownVariant.INFO,
    }),
    toolName: Property.ShortText({
      displayName: 'Tool Name',
      description: 'A short, descriptive name for this tool',
      required: true,
    }),
    toolDescription: Property.LongText({
      displayName: 'Tool Description',
      description: 'Describe what this tool does to help AI agents understand when to use it',
      required: true,
    }),
    jsonSchema: Property.Json({
      displayName: 'Input Schema',
      description: 'Define the input parameters using JSON Schema format',
      required: true,
      defaultValue: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'The query to process'
          }
        },
        required: ['query']
      }
    }),
  },
  sampleData: {
    query: 'Sample query from an AI agent'
  },
  type: TriggerStrategy.WEBHOOK,
  async onEnable() {
    return;
  },
  async onDisable() {
    return;
  },
  async run(context) {
    try {
      const payload = context.payload.body as Record<string, unknown>;

      try {
        const jsonSchema = context.propsValue.jsonSchema;
        const ajv = new Ajv({
          allErrors: true,
          verbose: true,
          strict: false
        });
        
        addFormats(ajv);
        
        const validate = ajv.compile(jsonSchema);
        const valid = validate(payload);
        
        if (!valid) {
          console.error('Schema validation errors:', JSON.stringify(validate.errors, null, 2));
          return [];
        }
      } catch (validationError) {
        console.error('Schema validation error:', validationError);
        return [];
      }
      
      return [payload];
    } catch (error) {
      console.error('Error processing AI trigger:', error);
      return [];
    }
  },
});