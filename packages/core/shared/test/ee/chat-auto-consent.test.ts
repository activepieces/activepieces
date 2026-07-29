import { describe, expect, it } from 'vitest'
import { autoConsent } from '../../src/lib/ee/chat/auto-consent'

describe('autoConsent.judgeable', () => {
    it('lets the judge rule on the full-access envelope only', () => {
        expect(autoConsent.judgeable({ kinds: ['external_write'] })).toBe(true)
        expect(autoConsent.judgeable({ kinds: ['outward_send'] })).toBe(true)
        expect(autoConsent.judgeable({ kinds: ['external_write', 'outward_send'] })).toBe(true)
    })

    it('never lets the judge rule on money, deletions, code, or the unknown', () => {
        expect(autoConsent.judgeable({ kinds: ['financial'] })).toBe(false)
        expect(autoConsent.judgeable({ kinds: ['destructive'] })).toBe(false)
        expect(autoConsent.judgeable({ kinds: ['internal_destructive'] })).toBe(false)
        expect(autoConsent.judgeable({ kinds: ['input_dependent'] })).toBe(false)
        expect(autoConsent.judgeable({ kinds: ['unknown'] })).toBe(false)
    })

    it('one out-of-envelope effect poisons the whole bundle', () => {
        expect(autoConsent.judgeable({ kinds: ['outward_send', 'financial'] })).toBe(false)
        expect(autoConsent.judgeable({ kinds: ['external_write', 'destructive'] })).toBe(false)
    })

    it('refuses when nothing resolved or the turn is tainted', () => {
        expect(autoConsent.judgeable({ kinds: [] })).toBe(false)
        expect(autoConsent.judgeable({ kinds: ['outward_send'], resolved: false })).toBe(false)
        expect(autoConsent.judgeable({ kinds: ['outward_send'], tainted: true })).toBe(false)
    })
})

describe('autoConsent.parseJudgeVerdict', () => {
    it('parses a clean run verdict', () => {
        expect(autoConsent.parseJudgeVerdict('{"decision":"run","reason":"Sends the recap you asked for"}')).toEqual({
            decision: 'run',
            reason: 'Sends the recap you asked for',
        })
    })

    it('parses an ask verdict with surrounding prose', () => {
        const verdict = autoConsent.parseJudgeVerdict('Sure! Here is my answer:\n{"decision":"ask","reason":"Recipient was never mentioned"}\nHope that helps.')
        expect(verdict).toEqual({ decision: 'ask', reason: 'Recipient was never mentioned' })
    })

    it('falls back to ask on garbage, missing decision, or unexpected values', () => {
        expect(autoConsent.parseJudgeVerdict('').decision).toBe('ask')
        expect(autoConsent.parseJudgeVerdict('yes, run it').decision).toBe('ask')
        expect(autoConsent.parseJudgeVerdict('{"decision":"approve"}').decision).toBe('ask')
        expect(autoConsent.parseJudgeVerdict('{"reason":"fine"}').decision).toBe('ask')
        expect(autoConsent.parseJudgeVerdict('{not json').decision).toBe('ask')
    })

    it('clamps an oversized reason and supplies one when missing', () => {
        const long = 'x'.repeat(500)
        const verdict = autoConsent.parseJudgeVerdict(`{"decision":"run","reason":"${long}"}`)
        expect(verdict.reason.length).toBeLessThanOrEqual(140)
        expect(autoConsent.parseJudgeVerdict('{"decision":"run"}').reason).toBe(autoConsent.FALLBACK_ASK_REASON)
    })

    it('clamps the user-facing reason at a word boundary and never leaks a debug marker', () => {
        const wordy = 'User explicitly requested to send a message to the chat-testing channel now and the channel, message content and intent all match the request exactly'
        const { reason } = autoConsent.parseJudgeVerdict(`{"decision":"run","reason":"${wordy}"}`)
        expect(reason).not.toContain('[truncated]')
        expect(reason.endsWith('…')).toBe(true)
        expect(reason).not.toMatch(/\s…$/)
        expect(wordy.startsWith(reason.slice(0, -1))).toBe(true)
    })
})

describe('autoConsent.buildJudgePrompt', () => {
    it('includes the user request, the action, its effects, and the input', () => {
        const prompt = autoConsent.buildJudgePrompt({
            userRequest: 'Email the weekly recap to farah@example.com',
            toolName: 'ap_send_email',
            actionLabel: 'Send weekly recap',
            kinds: ['outward_send'],
            input: { to: ['farah@example.com'], subject: 'Weekly recap' },
        })
        expect(prompt).toContain('Email the weekly recap to farah@example.com')
        expect(prompt).toContain('Send weekly recap')
        expect(prompt).toContain('sends a real message to someone')
        expect(prompt).toContain('farah@example.com')
        expect(prompt).toContain('"ask"')
    })

    it('truncates an oversized input instead of shipping it whole', () => {
        const prompt = autoConsent.buildJudgePrompt({
            userRequest: 'Update the sheet',
            toolName: 'ap_execute_action',
            actionLabel: 'update_row',
            kinds: ['external_write'],
            input: { rows: 'y'.repeat(50_000) },
        })
        expect(prompt.length).toBeLessThan(10_000)
        expect(prompt).toContain('…[truncated]')
    })

    it('names the batch size so the judge can weigh scale', () => {
        const prompt = autoConsent.buildJudgePrompt({
            userRequest: 'Message the three people I listed',
            toolName: 'ap_execute_action',
            actionLabel: 'send_message',
            kinds: ['outward_send'],
            input: { samples: [] },
            batchCount: 200,
        })
        expect(prompt).toContain('BATCH of 200')
    })
})
