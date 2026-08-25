import { describe, expect, it } from 'vitest'
import { agentVisibility, ApEdition } from '../../src/index'

function resolve({ edition, releaseEnabled, planAgentsEnabled }: {
    edition: ApEdition
    releaseEnabled: boolean
    planAgentsEnabled: boolean
}): boolean {
    return agentVisibility.resolveAgentsEnabled({ edition, releaseEnabled, planAgentsEnabled })
}

const SELF_HOSTED = [ApEdition.COMMUNITY, ApEdition.ENTERPRISE]

describe('whether a platform has the Agents surface', () => {
    it('is off everywhere while the release gate is closed, however the plan reads', () => {
        for (const edition of [...SELF_HOSTED, ApEdition.CLOUD]) {
            for (const planAgentsEnabled of [true, false]) {
                expect(resolve({ edition, releaseEnabled: false, planAgentsEnabled }), `${edition} ${planAgentsEnabled}`).toBe(false)
            }
        }
    })

    it('needs the entitlement on cloud, where a billing provider owns it', () => {
        expect(resolve({ edition: ApEdition.CLOUD, releaseEnabled: true, planAgentsEnabled: true })).toBe(true)
        expect(resolve({ edition: ApEdition.CLOUD, releaseEnabled: true, planAgentsEnabled: false })).toBe(false)
    })

    it('takes the operator at their word on a self-host, where nothing grants the entitlement', () => {
        for (const edition of SELF_HOSTED) {
            expect(resolve({ edition, releaseEnabled: true, planAgentsEnabled: false }), edition).toBe(true)
            expect(resolve({ edition, releaseEnabled: true, planAgentsEnabled: true }), edition).toBe(true)
        }
    })
})
