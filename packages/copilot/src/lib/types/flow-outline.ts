import { z } from 'zod';

// Define piece settings schema
export const PieceSettings = z.object({
  pieceName: z.string(),
  triggerName: z.string().optional(),
  actionName: z.string().optional(),
});

// Define input parameters
export const FlowInput = z.record(z.any());

// Define the base step type without conditions
export interface BaseStepType {
  description: string;
  piece: z.infer<typeof PieceSettings>;
  input?: Record<string, any>;
}

// Define router child type
export interface RouterChildType extends BaseStepType {
  condition: string;
}

// Define router step type
export interface RouterStepType {
  description: string;
  children: RouterChildType[];
  nextAction?: FlowStepType | null;
}

// Define the flow step type (can be either a base step or a router)
export interface FlowStepType {
  description: string;
  type: 'PIECE' | 'ROUTER';
  piece?: z.infer<typeof PieceSettings>;
  input?: Record<string, any>;
  children?: RouterChildType[];
  nextAction?: FlowStepType | null;
}

// Define the schemas
export const RouterChild = z.object({
  description: z.string(),
  condition: z.string(),
  piece: PieceSettings,
  input: FlowInput.optional(),
});

export const FlowStep: z.ZodType<FlowStepType> = z.lazy(() => 
  z.object({
    description: z.string(),
    type: z.enum(['PIECE', 'ROUTER']),
    piece: PieceSettings.optional(),
    input: FlowInput.optional(),
    children: z.array(RouterChild).optional(),
    nextAction: z.union([FlowStep, z.null()]).optional(),
  })
);

// Define the flow trigger type and schema
export interface FlowTriggerType {
  description: string;
  piece: z.infer<typeof PieceSettings>;
  input?: Record<string, any>;
  nextAction: FlowStepType;
}

export const FlowTrigger: z.ZodType<FlowTriggerType> = z.object({
  description: z.string(),
  piece: PieceSettings,
  input: FlowInput.optional(),
  nextAction: FlowStep,
});

// Export additional types
export type PieceSettings = z.infer<typeof PieceSettings>;
export type FlowInput = z.infer<typeof FlowInput>;
export type RouterChild = z.infer<typeof RouterChild>;
export type FlowTrigger = z.infer<typeof FlowTrigger>;