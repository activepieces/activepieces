import { z } from 'zod';

export interface PieceSettingsType {
  pieceName: string;
  triggerName?: string;
  actionName?: string;
}

export const PieceSettings: z.ZodType<PieceSettingsType> = z.object({
  pieceName: z.string(),
  triggerName: z.string().optional(),
  actionName: z.string().optional(),
});

export type FlowInputType = Record<string, any>;
export const FlowInput = z.record(z.any());

export interface RouterChildType {
  name: string;
  condition: string;
  piece: PieceSettingsType;
  input?: FlowInputType;
}

export const RouterChild: z.ZodType<RouterChildType> = z.object({
  name: z.string(),
  condition: z.string(),
  piece: PieceSettings,
  input: FlowInput.optional(),
});

export interface FlowStepType {
  name: string;
  type: 'PIECE_TRIGGER' | 'PIECE' | 'ROUTER';
  piece?: PieceSettingsType;
  input?: FlowInputType;
  children?: RouterChildType[];
}

export const FlowStep: z.ZodType<FlowStepType> = z.object({
  name: z.string(),
  type: z.enum(['PIECE_TRIGGER', 'PIECE', 'ROUTER']),
  piece: PieceSettings.optional(),
  input: FlowInput.optional(),
  children: z.array(RouterChild).optional(),
});

export interface FlowType {
  name: string;
  description: string;
  steps: FlowStepType[];
}

export const Flow: z.ZodType<FlowType> = z.object({
  name: z.string(),
  description: z.string(),
  steps: z.array(FlowStep),
});
