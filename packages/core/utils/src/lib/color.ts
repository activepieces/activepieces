import * as z from 'zod/mini'

export const ColorHex = z.string().check(z.regex(/^#[0-9A-Fa-f]{6}$/))
export type ColorHex = z.infer<typeof ColorHex>
