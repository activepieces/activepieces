import { PropertyType } from '@activepieces/pieces-framework'
import { describe, expect, it } from 'vitest'
import { PropertyResolutionResult } from '../../../../src/app/mcp/tools/mcp-utils'
import { propertyChainResolver, propertyOptionMatch } from '../../../../src/app/mcp/tools/property-chain-resolver'

const SPREADSHEETS = [{ label: 'Leads 2026', value: 'ss-leads' }, { label: 'Budget', value: 'ss-budget' }]
const SHEETS = [{ label: 'Sheet1', value: 0 }]
const options = (list: Array<{ label: string, value: unknown }>): PropertyResolutionResult => ({ status: 'options', options: list })

describe('propertyChainResolver.walkChain', () => {
    it('resolves a dependent chain in one pass, feeding each pick into the next field', async () => {
        const inputs: Record<string, unknown>[] = []
        const resolved = await propertyChainResolver.walkChain({
            propertyChain: [{ propertyName: 'spreadsheet', match: 'leads' }, { propertyName: 'sheet' }, { propertyName: 'columns' }],
            initialInput: { auth: 'x' },
            resolveOne: async ({ item, input }) => {
                inputs.push(input)
                if (item.propertyName === 'spreadsheet') return options(SPREADSHEETS)
                if (item.propertyName === 'sheet') return options(SHEETS)
                return { status: 'dynamic', props: { name: { type: PropertyType.SHORT_TEXT, displayName: 'Name', required: true } } }
            },
        })
        expect(resolved.map((rp) => rp.resolved)).toEqual([true, true, true])
        expect(resolved[0]).toMatchObject({ selectedValue: 'ss-leads', pickedBy: 'match' })
        expect(resolved[1]).toMatchObject({ selectedValue: 0, pickedBy: 'only-option' })
        expect(resolved[2].dynamicFields).toHaveLength(1)
        expect(inputs[2]).toEqual({ auth: 'x', spreadsheet: 'ss-leads', sheet: 0 })
    })

    it('a single field is a chain of one and returns its options when nothing is chosen', async () => {
        const resolved = await propertyChainResolver.walkChain({
            propertyChain: [{ propertyName: 'spreadsheet' }],
            initialInput: {},
            resolveOne: async () => options(SPREADSHEETS),
        })
        expect(resolved).toEqual([{ propertyName: 'spreadsheet', options: SPREADSHEETS, resolved: false }])
    })

    it('stops at a failed field', async () => {
        const resolved = await propertyChainResolver.walkChain({
            propertyChain: [{ propertyName: 'a', selectedValue: '1' }, { propertyName: 'b' }, { propertyName: 'c' }],
            initialInput: {},
            resolveOne: async ({ item }) => item.propertyName === 'a' ? options(SPREADSHEETS) : { status: 'failed', message: 'down' },
        })
        expect(resolved).toHaveLength(2)
        expect(resolved[1].error).toContain('Could not resolve options')
    })
})

describe('propertyChainResolver.summarize', () => {
    it('lists unresolved options with their values in the text', () => {
        const text = propertyChainResolver.summarize({ resolvedProperties: [{ propertyName: 'spreadsheet', options: SPREADSHEETS, resolved: false }], needsAuth: true, hasAuth: true })
        expect(text).toContain('ss-leads')
        expect(text).toContain('"value"')
    })

    it('explains empty options by whether a connection was passed', () => {
        const empty = [{ propertyName: 'channel', options: [], resolved: false }]
        expect(propertyChainResolver.summarize({ resolvedProperties: empty, needsAuth: true, hasAuth: false })).toContain('Pass the connection externalId as auth')
        expect(propertyChainResolver.summarize({ resolvedProperties: empty, needsAuth: true, hasAuth: true })).toContain('wrong/expired')
        expect(propertyChainResolver.summarize({ resolvedProperties: empty, needsAuth: false, hasAuth: false })).toContain('no options found')
    })
})

const SHEET_OPTIONS = [
    { label: 'Sales', value: 'sheet-sales' },
    { label: 'Sales leads 2026', value: 'sheet-leads' },
    { label: 'Marketing', value: 'sheet-marketing' },
]

describe('propertyOptionMatch.choose', () => {
    it('picks the only option without needing a name', () => {
        expect(propertyOptionMatch.choose({ options: [{ label: 'Sheet1', value: 0 }], match: undefined })).toMatchObject({ picked: { value: 0 }, reason: 'only-option' })
    })

    it('prefers an exact name over one that only contains it', () => {
        expect(propertyOptionMatch.choose({ options: SHEET_OPTIONS, match: 'sales' })).toMatchObject({ picked: { value: 'sheet-sales' }, reason: 'match' })
    })

    it('matches on the words the user used, ignoring case and punctuation', () => {
        expect(propertyOptionMatch.choose({ options: SHEET_OPTIONS, match: 'Leads' })).toMatchObject({ picked: { value: 'sheet-leads' } })
    })

    it('does not guess between equally good matches, and returns them', () => {
        const options = [{ label: 'Leads (old)', value: 1 }, { label: 'Leads (new)', value: 2 }, { label: 'Billing', value: 3 }]

        const choice = propertyOptionMatch.choose({ options, match: 'leads' })

        expect(choice.picked).toBeUndefined()
        expect(choice.candidates.map((option) => option.value)).toEqual([1, 2])
    })

    it('picks nothing without a name when there are several options', () => {
        expect(propertyOptionMatch.choose({ options: SHEET_OPTIONS, match: undefined })).toEqual({ candidates: [] })
    })

    it('never matches an option with an empty label', () => {
        expect(propertyOptionMatch.choose({ options: [{ label: '', value: 'x' }, { label: 'Other', value: 'y' }], match: 'leads' })).toEqual({ candidates: [] })
    })
})
