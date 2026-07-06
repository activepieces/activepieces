import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

// B4 — keep the always-on system prompt instructable. The "uninstructable" problem was unbounded
// growth + duplicated doctrine. These guards stop the prompt from silently bloating past a ceiling
// and pin the section contract, so a future edit that re-bloats it fails CI loudly. (The deeper
// de-dup/modularization is tracked separately; this prevents regression in the meantime.)
const PROMPT_PATH = path.resolve('packages/server/api/src/assets/prompts/chat-system-prompt.md')
const CHARS_PER_TOKEN = 4
// ~22.5k tokens today. Ceiling set just above to block bloat while leaving room for the planned
// de-dup to bring it DOWN. Lower this number as de-dup lands — never raise it without a reason.
const MAX_TOKENS = 25_000

const REQUIRED_SECTIONS = ['<identity>', '<persona>', '<product_model>', '<interpreting_intent>', '<operating_principles>', '<guardrails>', '<discovery>', '<guides>', '<decision_framework>']

describe('chat system prompt guard (B4)', () => {
    const prompt = readFileSync(PROMPT_PATH, 'utf8')

    it('stays under the always-on token ceiling', () => {
        const estimatedTokens = Math.ceil(prompt.length / CHARS_PER_TOKEN)
        expect(estimatedTokens, `system prompt ~${estimatedTokens} tokens exceeds the ${MAX_TOKENS} ceiling — de-dup before adding more`).toBeLessThanOrEqual(MAX_TOKENS)
    })

    it('contains every required top-level section (structure contract)', () => {
        for (const section of REQUIRED_SECTIONS) {
            expect(prompt, `missing required section ${section}`).toContain(section)
        }
    })
})
