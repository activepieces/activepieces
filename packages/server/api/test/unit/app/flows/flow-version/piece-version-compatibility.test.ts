import { TriggerStrategy, TriggerTestStrategy } from '@activepieces/core-piece-types'
import { ActionBase, PieceAuth, Property, TriggerBase } from '@activepieces/pieces-framework'
import { describe, expect, it } from 'vitest'
import { PieceStepUsage, pieceVersionCompatibility, PieceVersionMetadata } from '../../../../../src/app/flows/flow-version/migrations/piece-version-compatibility'

function action(overrides: Partial<ActionBase> = {}): ActionBase {
    return {
        name: 'send_message',
        displayName: 'Send Message',
        description: '',
        requireAuth: true,
        props: {
            channel: Property.ShortText({ displayName: 'Channel', required: true }),
            text: Property.ShortText({ displayName: 'Text', required: false }),
        },
        ...overrides,
    }
}

function trigger(overrides: Partial<TriggerBase> = {}): TriggerBase {
    return {
        name: 'new_message',
        displayName: 'New Message',
        description: '',
        requireAuth: true,
        props: {},
        type: TriggerStrategy.POLLING,
        sampleData: {},
        testStrategy: TriggerTestStrategy.TEST_FUNCTION,
        ...overrides,
    }
}

function metadata(overrides: Partial<PieceVersionMetadata> = {}): PieceVersionMetadata {
    return {
        version: '0.2.0',
        auth: PieceAuth.SecretText({ displayName: 'Api Key', required: true }),
        actions: { send_message: action() },
        triggers: { new_message: trigger() },
        ...overrides,
    }
}

const actionUsage: PieceStepUsage = { kind: 'action', stepName: 'send_message', inputKeys: ['channel', 'text'] }
const triggerUsage: PieceStepUsage = { kind: 'trigger', stepName: 'new_message', inputKeys: [] }

describe('pieceVersionCompatibility.compare', () => {
    it('passes when the used action is unchanged', () => {
        const result = pieceVersionCompatibility.compare({ usage: actionUsage, oldMetadata: metadata({ version: '0.1.0' }), candidateMetadata: metadata() })
        expect(result).toEqual({ compatible: true, failedChecks: [] })
    })

    it('fails when the used action was removed', () => {
        const result = pieceVersionCompatibility.compare({ usage: actionUsage, oldMetadata: metadata({ version: '0.1.0' }), candidateMetadata: metadata({ actions: {} }) })
        expect(result.compatible).toBe(false)
        expect(result.failedChecks).toEqual([{ check: 'STEP_REMOVED', detail: 'action send_message does not exist in 0.2.0' }])
    })

    it('fails when a prop the step fills was removed', () => {
        const candidate = metadata({ actions: { send_message: action({ props: { channel: Property.ShortText({ displayName: 'Channel', required: true }) } }) } })
        const result = pieceVersionCompatibility.compare({ usage: actionUsage, oldMetadata: metadata({ version: '0.1.0' }), candidateMetadata: candidate })
        expect(result.failedChecks).toEqual([{ check: 'PROP_REMOVED', detail: 'text' }])
    })

    it('ignores a removed prop the step does not fill', () => {
        const usage: PieceStepUsage = { ...actionUsage, inputKeys: ['channel'] }
        const candidate = metadata({ actions: { send_message: action({ props: { channel: Property.ShortText({ displayName: 'Channel', required: true }) } }) } })
        const result = pieceVersionCompatibility.compare({ usage, oldMetadata: metadata({ version: '0.1.0' }), candidateMetadata: candidate })
        expect(result.compatible).toBe(true)
    })

    it('fails when a filled prop changed type', () => {
        const candidate = metadata({ actions: { send_message: action({ props: {
            channel: Property.StaticDropdown({ displayName: 'Channel', required: true, options: { options: [] } }),
            text: Property.ShortText({ displayName: 'Text', required: false }),
        } }) } })
        const result = pieceVersionCompatibility.compare({ usage: actionUsage, oldMetadata: metadata({ version: '0.1.0' }), candidateMetadata: candidate })
        expect(result.failedChecks).toEqual([{ check: 'PROP_TYPE_CHANGED', detail: 'channel: SHORT_TEXT -> STATIC_DROPDOWN' }])
    })

    it('fails when a new required prop without default is not filled', () => {
        const candidate = metadata({ actions: { send_message: action({ props: {
            ...action().props,
            thread: Property.ShortText({ displayName: 'Thread', required: true }),
        } }) } })
        const result = pieceVersionCompatibility.compare({ usage: actionUsage, oldMetadata: metadata({ version: '0.1.0' }), candidateMetadata: candidate })
        expect(result.failedChecks).toEqual([{ check: 'NEW_REQUIRED_PROP', detail: 'thread' }])
    })

    it('passes when a new required prop has a default value', () => {
        const candidate = metadata({ actions: { send_message: action({ props: {
            ...action().props,
            thread: Property.ShortText({ displayName: 'Thread', required: true, defaultValue: 'main' }),
        } }) } })
        const result = pieceVersionCompatibility.compare({ usage: actionUsage, oldMetadata: metadata({ version: '0.1.0' }), candidateMetadata: candidate })
        expect(result.compatible).toBe(true)
    })

    it('passes when the prop was already required in the old version', () => {
        const result = pieceVersionCompatibility.compare({
            usage: { ...actionUsage, inputKeys: ['text'] },
            oldMetadata: metadata({ version: '0.1.0' }),
            candidateMetadata: metadata(),
        })
        expect(result.compatible).toBe(true)
    })

    it('fails when auth type changed', () => {
        const candidate = metadata({ auth: PieceAuth.OAuth2({ authUrl: 'https://a', tokenUrl: 'https://t', required: true, scope: [] }) })
        const result = pieceVersionCompatibility.compare({ usage: actionUsage, oldMetadata: metadata({ version: '0.1.0' }), candidateMetadata: candidate })
        expect(result.failedChecks).toEqual([{ check: 'AUTH_CHANGED', detail: 'SECRET_TEXT -> OAUTH2' }])
    })

    it('fails when the trigger strategy changed', () => {
        const candidate = metadata({ triggers: { new_message: trigger({ type: TriggerStrategy.WEBHOOK }) } })
        const result = pieceVersionCompatibility.compare({ usage: triggerUsage, oldMetadata: metadata({ version: '0.1.0' }), candidateMetadata: candidate })
        expect(result.failedChecks).toEqual([{ check: 'TRIGGER_STRATEGY_CHANGED', detail: 'POLLING -> WEBHOOK' }])
    })

    it('compares output schema only when both versions define it', () => {
        const oldMetadata = metadata({ version: '0.1.0', actions: { send_message: action({ outputSchema: { fields: [{ key: 'id' }, { key: 'ts', format: 'datetime' }] } }) } })
        const removedField = metadata({ actions: { send_message: action({ outputSchema: { fields: [{ key: 'id' }] } }) } })
        expect(pieceVersionCompatibility.compare({ usage: actionUsage, oldMetadata, candidateMetadata: removedField }).failedChecks).toEqual([{ check: 'OUTPUT_FIELD_REMOVED', detail: 'ts' }])

        const formatChanged = metadata({ actions: { send_message: action({ outputSchema: { fields: [{ key: 'id' }, { key: 'ts', format: 'date' }] } }) } })
        expect(pieceVersionCompatibility.compare({ usage: actionUsage, oldMetadata, candidateMetadata: formatChanged }).failedChecks).toEqual([{ check: 'OUTPUT_FIELD_FORMAT_CHANGED', detail: 'ts: datetime -> date' }])

        const missingOnOneSide = pieceVersionCompatibility.compare({ usage: actionUsage, oldMetadata: metadata({ version: '0.1.0' }), candidateMetadata: removedField })
        expect(missingOnOneSide.compatible).toBe(true)
    })

    it('recurses into nested output schema fields', () => {
        const oldMetadata = metadata({ version: '0.1.0', actions: { send_message: action({ outputSchema: { fields: [{ key: 'user', children: [{ key: 'email' }] }] } }) } })
        const candidate = metadata({ actions: { send_message: action({ outputSchema: { fields: [{ key: 'user', children: [] }] } }) } })
        expect(pieceVersionCompatibility.compare({ usage: actionUsage, oldMetadata, candidateMetadata: candidate }).failedChecks).toEqual([{ check: 'OUTPUT_FIELD_REMOVED', detail: 'user.email' }])
    })
})

describe('pieceVersionCompatibility.resolveUpgrade', () => {
    function stubMetadata({ old, latest, sameMinor }: { old?: PieceVersionMetadata, latest?: PieceVersionMetadata, sameMinor?: PieceVersionMetadata }) {
        return async ({ version }: { version: string | undefined }): Promise<PieceVersionMetadata | undefined> => {
            if (version === undefined) {
                return latest
            }
            if (version.startsWith('~')) {
                return sameMinor
            }
            return old
        }
    }

    it('skips non-exact versions', async () => {
        const decision = await pieceVersionCompatibility.resolveUpgrade({ usage: actionUsage, currentVersion: '~0.1.0', getMetadata: stubMetadata({}) })
        expect(decision).toEqual({ outcome: 'skipped', reason: 'NON_EXACT_VERSION' })
    })

    it('skips pieces that are not official', async () => {
        const decision = await pieceVersionCompatibility.resolveUpgrade({ usage: actionUsage, currentVersion: '0.1.0', getMetadata: stubMetadata({}) })
        expect(decision).toEqual({ outcome: 'skipped', reason: 'NOT_AN_OFFICIAL_PIECE' })
    })

    it('skips when already on the latest version', async () => {
        const current = metadata({ version: '0.2.0' })
        const decision = await pieceVersionCompatibility.resolveUpgrade({ usage: actionUsage, currentVersion: '0.2.0', getMetadata: stubMetadata({ old: current, latest: current }) })
        expect(decision).toEqual({ outcome: 'skipped', reason: 'ALREADY_LATEST' })
    })

    it('upgrades to latest when compatible', async () => {
        const decision = await pieceVersionCompatibility.resolveUpgrade({
            usage: actionUsage,
            currentVersion: '0.1.0',
            getMetadata: stubMetadata({ old: metadata({ version: '0.1.0' }), latest: metadata({ version: '0.2.0' }) }),
        })
        expect(decision.outcome).toBe('upgraded')
        expect(decision.outcome === 'upgraded' && decision.toVersion).toBe('0.2.0')
        expect(decision.outcome === 'upgraded' && decision.candidate).toBe('latest')
    })

    it('falls back to the latest same-minor version when latest is incompatible', async () => {
        const decision = await pieceVersionCompatibility.resolveUpgrade({
            usage: actionUsage,
            currentVersion: '0.1.0',
            getMetadata: stubMetadata({
                old: metadata({ version: '0.1.0' }),
                latest: metadata({ version: '0.2.0', actions: {} }),
                sameMinor: metadata({ version: '0.1.9' }),
            }),
        })
        expect(decision.outcome).toBe('upgraded')
        expect(decision.outcome === 'upgraded' && decision.toVersion).toBe('0.1.9')
        expect(decision.outcome === 'upgraded' && decision.candidate).toBe('same-minor')
        expect(decision.outcome === 'upgraded' && decision.attempts.map((a) => a.version)).toEqual(['0.2.0', '0.1.9'])
    })

    it('keeps the current version when both candidates are incompatible', async () => {
        const decision = await pieceVersionCompatibility.resolveUpgrade({
            usage: actionUsage,
            currentVersion: '0.1.0',
            getMetadata: stubMetadata({
                old: metadata({ version: '0.1.0' }),
                latest: metadata({ version: '0.2.0', actions: {} }),
                sameMinor: metadata({ version: '0.1.9', actions: {} }),
            }),
        })
        expect(decision.outcome).toBe('kept')
        expect(decision.outcome === 'kept' && decision.attempts).toHaveLength(2)
        expect(decision.outcome === 'kept' && decision.attempts[0].failedChecks[0].check).toBe('STEP_REMOVED')
    })

    it('keeps the current version when no newer same-minor version exists', async () => {
        const decision = await pieceVersionCompatibility.resolveUpgrade({
            usage: actionUsage,
            currentVersion: '0.1.0',
            getMetadata: stubMetadata({
                old: metadata({ version: '0.1.0' }),
                latest: metadata({ version: '0.2.0', actions: {} }),
                sameMinor: metadata({ version: '0.1.0' }),
            }),
        })
        expect(decision.outcome).toBe('kept')
        expect(decision.outcome === 'kept' && decision.attempts).toHaveLength(1)
    })
})
