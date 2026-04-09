import { z } from 'zod';

export enum PropertyExecutionType {
  MANUAL = 'MANUAL',
  DYNAMIC = 'DYNAMIC',
}

export const PropertySettings = z.object({
  type: z.nativeEnum(PropertyExecutionType),
  schema: z.unknown().optional(),
});
export type PropertySettings = z.infer<typeof PropertySettings>;
