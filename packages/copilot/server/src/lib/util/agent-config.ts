import { z } from 'zod';

// =================== Types ===================
export interface BaseAgentConfig {
  systemPrompt: string;
  guidelines?: string[];
  requirements?: string[];
  outputSchema: {
    type: string;
    properties: Record<string, any>;
    required?: string[];
  };
}

// =================== System Prompt Factory ===================
export function createSystemPrompt(config: BaseAgentConfig): string {
  const parts = [config.systemPrompt];

  if (config.guidelines?.length) {
    parts.push('\nGuidelines:');
    parts.push(...config.guidelines.map(g => `- ${g}`));
  }

  if (config.requirements?.length) {
    parts.push('\nRequirements:');
    parts.push(...config.requirements.map(r => `- ${r}`));
  }

  return parts.join('\n');
}

// =================== Schema Factory ===================
export function createOutputSchema<T>(config: BaseAgentConfig): z.ZodType<T> {
  function convertJsonSchemaToZod(schema: any): any {
    if (schema.type === 'object') {
      const shape: Record<string, any> = {};
      for (const [key, value] of Object.entries(schema.properties || {})) {
        const field = convertJsonSchemaToZod(value as any);
        shape[key] = schema.required?.includes(key) ? field : field.optional();
      }
      return z.object(shape);
    } else if (schema.type === 'array') {
      return z.array(convertJsonSchemaToZod(schema.items));
    } else if (schema.type === 'string') {
      if (schema.enum) {
        return z.enum(schema.enum as [string, ...string[]]);
      }
      return z.string();
    } else if (schema.type === 'number') {
      return z.number();
    } else if (schema.type === 'boolean') {
      return z.boolean();
    }
    return z.any();
  }

  return convertJsonSchemaToZod(config.outputSchema) as z.ZodType<T>;
}

// =================== Parameter Schema Factory ===================
export function createParameterSchema(parameters: Record<string, any>): z.ZodObject<any> {
  return convertJsonSchemaToZod(parameters) as z.ZodObject<any>;
}

// Helper function to convert JSON Schema to Zod schema
function convertJsonSchemaToZod(schema: any): any {
  if (schema.type === 'object') {
    const shape: Record<string, any> = {};
    for (const [key, value] of Object.entries(schema.properties || {})) {
      const field = convertJsonSchemaToZod(value as any);
      const description = (value as any).description;
      shape[key] = description ? field.describe(description) : field;
      if (schema.required?.includes(key)) {
        shape[key] = shape[key];
      } else {
        shape[key] = shape[key].optional();
      }
    }
    return z.object(shape);
  } else if (schema.type === 'array') {
    return z.array(convertJsonSchemaToZod(schema.items));
  } else if (schema.type === 'string') {
    if (schema.enum) {
      return z.enum(schema.enum as [string, ...string[]]);
    }
    return z.string();
  } else if (schema.type === 'number') {
    return z.number();
  } else if (schema.type === 'boolean') {
    return z.boolean();
  }
  return z.any();
} 