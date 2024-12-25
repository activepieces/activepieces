import { z } from 'zod';

export const stepPlanSchema = z.object({
  type: z.enum(['PIECE_TRIGGER', 'PIECE', 'ROUTER']),
  pieceName: z.string(),
  actionOrTriggerName: z.string().optional(),
  condition: z.string().optional(),
});

export const planSchema = z.object({
  name: z.string(),
  description: z.string(),
  steps: z.array(stepPlanSchema),
});

export const stepGenerationSchema = z.object({
  name: z.string(),
  type: z.enum(['PIECE_TRIGGER', 'PIECE', 'ROUTER']),
  piece: z.object({
    pieceName: z.string(),
    triggerName: z.string().optional(),
    actionName: z.string().optional(),
  }),
  input: z.record(z.any()).optional(),
  children: z
    .array(
      z.object({
        name: z.string(),
        condition: z.string(),
        piece: z.object({
          pieceName: z.string(),
          actionName: z.string().optional(),
        }),
        input: z.record(z.any()).optional(),
      })
    )
    .optional(),
});
