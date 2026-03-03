import { Static, Type } from '@sinclair/typebox'

export const ColorHex = Type.String({
    pattern: '^#[0-9A-Fa-f]{6}$',
})
export type ColorHex = Static<typeof ColorHex>
