import { customAlphabet } from 'nanoid'
import { z } from 'zod'

const ALPHABET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'
const ID_LENGTH = 21

export const ApId = z.string().regex(new RegExp(`^[0-9a-zA-Z]{${ID_LENGTH}}$`))

export type ApId = z.infer<typeof ApId>

export const apId = customAlphabet(ALPHABET, ID_LENGTH)

export const secureApId = (length: number) => customAlphabet(ALPHABET, length)()
