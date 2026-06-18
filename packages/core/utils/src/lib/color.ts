import { z } from 'zod'

export const ColorHex = z.string().regex(/^#[0-9A-Fa-f]{6}$/)
export type ColorHex = z.infer<typeof ColorHex>
