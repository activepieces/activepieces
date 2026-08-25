import { customAlphabet } from 'nanoid'
import * as z from 'zod/mini'

const ALPHABET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'
const ID_LENGTH = 21

export const ApId = z.string().check(z.regex(new RegExp(`^[0-9a-zA-Z]{${ID_LENGTH}}$`)))

export type ApId = z.infer<typeof ApId>

export const apId = customAlphabet(ALPHABET, ID_LENGTH)

export const secureApId = (length: number) => customAlphabet(ALPHABET, length)()

export type ProjectId = ApId
export type FlowRunId = ApId
export type FlowId = ApId
export type FlowVersionId = ApId
export type PlatformId = ApId
export type UserId = ApId
