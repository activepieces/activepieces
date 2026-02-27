import { Static, Type } from '@sinclair/typebox'
import { customAlphabet } from 'nanoid'

const ALPHABET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'
const ID_LENGTH = 21

export const ApId = Type.String({
    pattern: `^[0-9a-zA-Z]{${ID_LENGTH}}$`,
})

export type ApId = Static<typeof ApId>

export const apId = customAlphabet(ALPHABET, ID_LENGTH)

export const secureApId = (length: number) => customAlphabet(ALPHABET, length)()