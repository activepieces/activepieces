import { z } from 'zod';

// Operations
// Simplified Flow Outline
export const SimpleFlowAction: z.ZodType = z.object({
    type: z.literal("simple"),
    nextAction: z.lazy(() => SimpleFlowAction)
});

export const ConditionalFlowAction: z.ZodType = z.object({
    type: z.literal("conditional"),
    children: z.map(z.string(), z.lazy(() => FlowAction)),
    nextAction: z.lazy(() => FlowAction)
});

export const FlowAction = z.union([SimpleFlowAction, ConditionalFlowAction]);

export const FlowTrigger = z.object({
    type: z.literal("trigger"),
    nextAction: FlowAction
});

export type FlowTrigger = z.infer<typeof FlowTrigger>;
export type FlowAction = z.infer<typeof FlowAction>;
export type SimpleFlowAction = z.infer<typeof SimpleFlowAction>;
export type ConditionalFlowAction = z.infer<typeof ConditionalFlowAction>;