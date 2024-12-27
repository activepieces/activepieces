import { z } from 'zod';

export const PieceSettings = z.object({
  pieceName: z.string(),
  triggerName: z.string().optional(),
  actionName: z.string().optional(),
});
export type PieceSettings = z.infer<typeof PieceSettings>;

export const FlowInput = z.record(z.any());
export type FlowInput = z.infer<typeof FlowInput>;

export const RouterChild = z.object({
  name: z.string(),
  condition: z.string(), 
  piece: PieceSettings,
  input: FlowInput.optional(),
});
export type RouterChild = z.infer<typeof RouterChild>;

export const FlowStep = z.object({
  name: z.string(),
  type: z.enum(['PIECE_TRIGGER', 'PIECE', 'ROUTER']),
  piece: PieceSettings.optional(),
  input: FlowInput.optional(),
  children: z.array(RouterChild).optional(),
});
export type FlowStep = z.infer<typeof FlowStep>;

export const Flow = z.object({
  name: z.string(),
  description: z.string(),
  steps: z.array(FlowStep),
});
export type Flow = z.infer<typeof Flow>;
