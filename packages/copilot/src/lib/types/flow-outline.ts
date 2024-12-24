import { z } from 'zod';

// Define piece settings schema
export const PieceSettings = z.object({
  pieceName: z.string(),
  triggerName: z.string().optional(),
  actionName: z.string().optional(),
});

// Define a simple action step
export const FlowStep = z.object({
  description: z.string(),
  piece: PieceSettings,
  input: z.record(z.any()).optional(),
});

// Define the flow trigger
export const FlowTrigger = z.object({
  description: z.string(),
  piece: PieceSettings,
  input: z.record(z.any()).optional(),
  nextAction: FlowStep,
});

// Export types
export type PieceSettings = z.infer<typeof PieceSettings>;
export type FlowStep = z.infer<typeof FlowStep>;
export type FlowTrigger = z.infer<typeof FlowTrigger>;
