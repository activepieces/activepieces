import { describe, expect, it } from 'vitest'
import { BarrierSignalStatus, shouldReleaseBarrier } from '../../../src/lib/flow-run/waitpoint'

describe('shouldReleaseBarrier', () => {
    describe('sealed barrier with no policy', () => {
        it('holds while any signal is still pending', () => {
            expect(shouldReleaseBarrier({
                policy: null,
                sealed: true,
                counts: { [BarrierSignalStatus.SUCCEEDED]: 2, [BarrierSignalStatus.PENDING]: 1 },
            })).toBe(false)
        })

        it('releases once nothing is pending', () => {
            expect(shouldReleaseBarrier({
                policy: null,
                sealed: true,
                counts: { [BarrierSignalStatus.SUCCEEDED]: 2, [BarrierSignalStatus.FAILED]: 1 },
            })).toBe(true)
        })

        it('releases when it awaits nothing at all', () => {
            expect(shouldReleaseBarrier({ policy: null, sealed: true, counts: {} })).toBe(true)
        })
    })

    describe('unsealed barrier', () => {
        it('holds even when nothing is pending, because more signals may still arrive', () => {
            expect(shouldReleaseBarrier({
                policy: null,
                sealed: false,
                counts: { [BarrierSignalStatus.SUCCEEDED]: 3 },
            })).toBe(false)
        })

        it('still releases when a policy is satisfied', () => {
            expect(shouldReleaseBarrier({
                policy: { requiredSuccesses: 2 },
                sealed: false,
                counts: { [BarrierSignalStatus.SUCCEEDED]: 2, [BarrierSignalStatus.PENDING]: 5 },
            })).toBe(true)
        })
    })

    describe('releaseOnFirstFailure', () => {
        it.each([
            BarrierSignalStatus.FAILED,
            BarrierSignalStatus.REJECTED,
            BarrierSignalStatus.CANCELED,
            BarrierSignalStatus.NOT_DISPATCHED,
        ])('releases on the first %s while others are still pending', (status) => {
            expect(shouldReleaseBarrier({
                policy: { releaseOnFirstFailure: true },
                sealed: true,
                counts: { [status]: 1, [BarrierSignalStatus.PENDING]: 4 },
            })).toBe(true)
        })

        it('does not release on a success', () => {
            expect(shouldReleaseBarrier({
                policy: { releaseOnFirstFailure: true },
                sealed: true,
                counts: { [BarrierSignalStatus.SUCCEEDED]: 3, [BarrierSignalStatus.PENDING]: 1 },
            })).toBe(false)
        })

        it('is ignored when set to false', () => {
            expect(shouldReleaseBarrier({
                policy: { releaseOnFirstFailure: false },
                sealed: true,
                counts: { [BarrierSignalStatus.FAILED]: 1, [BarrierSignalStatus.PENDING]: 1 },
            })).toBe(false)
        })
    })

    describe('requiredSuccesses', () => {
        it('holds below the threshold', () => {
            expect(shouldReleaseBarrier({
                policy: { requiredSuccesses: 3 },
                sealed: true,
                counts: { [BarrierSignalStatus.SUCCEEDED]: 2, [BarrierSignalStatus.PENDING]: 2 },
            })).toBe(false)
        })

        it('releases at the threshold', () => {
            expect(shouldReleaseBarrier({
                policy: { requiredSuccesses: 3 },
                sealed: true,
                counts: { [BarrierSignalStatus.SUCCEEDED]: 3, [BarrierSignalStatus.PENDING]: 2 },
            })).toBe(true)
        })

        it('releases above the threshold', () => {
            expect(shouldReleaseBarrier({
                policy: { requiredSuccesses: 1 },
                sealed: true,
                counts: { [BarrierSignalStatus.SUCCEEDED]: 4, [BarrierSignalStatus.PENDING]: 2 },
            })).toBe(true)
        })
    })

    it('takes the first satisfied branch when both policies are set', () => {
        expect(shouldReleaseBarrier({
            policy: { releaseOnFirstFailure: true, requiredSuccesses: 10 },
            sealed: true,
            counts: { [BarrierSignalStatus.FAILED]: 1, [BarrierSignalStatus.PENDING]: 9 },
        })).toBe(true)
    })
})
