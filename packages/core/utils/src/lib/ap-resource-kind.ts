import { z } from 'zod'

export const ApResourceKind = z.enum(['flow', 'table'])
export type ApResourceKind = z.infer<typeof ApResourceKind>
