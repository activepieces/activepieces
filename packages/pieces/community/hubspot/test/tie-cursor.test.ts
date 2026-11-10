import { describe, expect, it, vi } from 'vitest'
import { hubspotPolling } from '../src/lib/common/polling'

const at = 1_700_000_000_000
const entries = (ids: string[]) => ids.map((id) => ({ time: at, id }))

describe('tie cursor', () => {
    it('a complete group resumes after the last processed id with no id list', () => {
        const next = hubspotPolling.advanceTie({ processed: entries(['1', '2', '3']), groupComplete: true })
        expect(next).toEqual({ time: at, afterId: '3' })
        const isNew = hubspotPolling.tieFilter({ cursor: next, since: at })
        expect(['2', '3', '4', '10'].filter((id) => isNew({ time: at, id }))).toEqual(['4', '10'])
        expect(isNew({ time: at + 1, id: '1' })).toBe(true)
        expect(isNew({ time: at - 1, id: '9' })).toBe(false)
    })

    it('an incomplete group keeps the processed ids and skips only those', () => {
        const next = hubspotPolling.advanceTie({ processed: entries(['5', '7']), groupComplete: false })
        expect(next).toEqual({ time: at, ids: ['5', '7'] })
        const isNew = hubspotPolling.tieFilter({ cursor: next, since: at })
        expect(['1', '5', '6', '7', '8'].filter((id) => isNew({ time: at, id }))).toEqual(['1', '6', '8'])
        const completed = hubspotPolling.advanceTie({ cursor: next, processed: entries(['1', '6']), groupComplete: true })
        expect(completed).toEqual({ time: at, afterId: '6', ids: ['7'] })
        const after = hubspotPolling.tieFilter({ cursor: completed, since: at })
        expect(['5', '6', '7', '8'].filter((id) => after({ time: at, id }))).toEqual(['8'])
    })

    it('an incomplete group past the id limit moves past that millisecond with a warning instead of growing the cursor', () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
        const next = hubspotPolling.advanceTie({ processed: entries(Array.from({ length: 10_001 }, (_, i) => String(i))), groupComplete: false })
        expect(next).toEqual({ time: at })
        expect(warn).toHaveBeenCalled()
        expect(hubspotPolling.tieFilter({ cursor: next, since: at })({ time: at, id: '99999' })).toBe(false)
        warn.mockRestore()
    })

    it('a cursor saved for another time is ignored', () => {
        const isNew = hubspotPolling.tieFilter({ cursor: { time: at - 5, afterId: '3' }, since: at })
        expect(isNew({ time: at, id: '1' })).toBe(false)
        expect(isNew({ time: at + 1, id: '1' })).toBe(true)
    })
})
