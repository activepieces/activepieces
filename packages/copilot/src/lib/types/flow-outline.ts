import { z } from 'zod';

export const SimpleFlowAction: z.ZodType = z.object({
  description: z.string(),
});

export const ConditionalFlowAction: z.ZodType = z.object({
  description: z.string(),
  children: z.array(
    z.object({
      condition: z.string(),
    })
  ),
});

export const FlowAction = z.union([SimpleFlowAction, ConditionalFlowAction]);

export const FlowTrigger = z.object({
  description: z.string(),
  nextAction: FlowAction,
});

export type FlowTrigger = z.infer<typeof FlowTrigger>;
export type FlowAction = z.infer<typeof FlowAction>;
export type SimpleFlowAction = z.infer<typeof SimpleFlowAction>;
export type ConditionalFlowAction = z.infer<typeof ConditionalFlowAction>;
