import { jsonSchema } from "ai";

export const markAsFinishSchema = jsonSchema<{
  success: boolean;
}>({
  type: 'object',
  properties: {
    success: {
      type: 'boolean',
      description: 'Set to true if the goal was achieved, false if abandoned or failed.',
    },
  },
  required: ['success'],
  additionalProperties: false,
});