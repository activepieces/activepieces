import {
  AgentOutputField,
  AgentOutputFieldType,
  agentToolsName,
} from '@activepieces/shared';
import { z, ZodObject } from 'zod';

export const agentUtils = {
  isTaskCompletionToolCall: (toolName: string) => toolName === agentToolsName.TASK_COMPLETION_TOOL_NAME,
  structuredOutputSchema(outputFields: AgentOutputField[]): ZodObject | undefined {
    const shape: Record<string, z.ZodType> = {};

    for (const field of outputFields) {
      switch (field.type) {
        case AgentOutputFieldType.TEXT:
          shape[field.displayName] = z.string();
          break;
        case AgentOutputFieldType.NUMBER:
          shape[field.displayName] = z.number();
          break;
        case AgentOutputFieldType.BOOLEAN:
          shape[field.displayName] = z.boolean();
          break;
        default:
          shape[field.displayName] = z.any();
      }
    }
    return Object.keys(shape).length > 0 ? z.object(shape) : undefined;
  },
}