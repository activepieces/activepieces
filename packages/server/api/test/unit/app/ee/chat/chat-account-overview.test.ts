import { describe, expect, it, vi } from 'vitest'

// buildNote is a pure formatter; mock the service modules it imports so the test stays
// hermetic and never touches the DB import chain.
vi.mock('../../../../../src/app/flows/flow/flow.service', () => ({ flowService: () => ({}) }))
vi.mock('../../../../../src/app/tables/table/table.service', () => ({ tableService: {} }))
vi.mock('../../../../../src/app/app-connection/app-connection-service/app-connection-service', () => ({ appConnectionService: () => ({}) }))

type Overview = {
    projectCount: number
    totalFlows: number
    activeFlows: number
    totalTables: number
    recentFlowNames: string[]
    recentTableNames: string[]
    connectionsByPiece: { pieceName: string, count: number }[]
}

const baseOverview: Overview = {
    projectCount: 1,
    totalFlows: 0,
    activeFlows: 0,
    totalTables: 0,
    recentFlowNames: [],
    recentTableNames: [],
    connectionsByPiece: [],
}

async function buildNote(overrides: Partial<Overview>): Promise<string> {
    const { chatAccountOverview } = await import('../../../../../src/app/ee/chat/chat-account-overview')
    return chatAccountOverview.buildNote({ overview: { ...baseOverview, ...overrides } })
}

function pieces(count: number): { pieceName: string, count: number }[] {
    return Array.from({ length: count }, (_, i) => ({ pieceName: `@activepieces/piece-app${i}`, count: count - i }))
}

describe('chatAccountOverview.buildNote', () => {
    it('renders the empty-state line and no bullets when the user has nothing', async () => {
        const note = await buildNote({})
        expect(note).toContain('hasn\'t built anything yet')
        expect(note).not.toContain('- Flows:')
        expect(note).not.toContain('- Tables:')
    })

    it('renders flow total + live count and table total', async () => {
        const note = await buildNote({ totalFlows: 42, activeFlows: 12, totalTables: 8 })
        expect(note).toContain('- Flows: 42 (12 live)')
        expect(note).toContain('- Tables: 8.')
    })

    it('uses a multi-project clause only when more than one project', async () => {
        const single = await buildNote({ projectCount: 1, totalFlows: 3 })
        expect(single).toContain('in their workspace')
        expect(single).not.toContain('across 1 projects')

        const multi = await buildNote({ projectCount: 3, totalFlows: 3 })
        expect(multi).toContain('across the 3 projects they can access')
        expect(multi).toContain('- Flows: 3 (0 live) across 3 projects')
    })

    it('renders recent names and omits the Recent clause when there are none', async () => {
        const withNames = await buildNote({
            totalFlows: 2,
            recentFlowNames: ['Lead router', 'Onboarding emailer'],
            totalTables: 1,
            recentTableNames: ['Leads'],
        })
        expect(withNames).toContain('Recent: Lead router, Onboarding emailer.')
        expect(withNames).toContain('Recent: Leads.')

        const noNames = await buildNote({ totalFlows: 2, recentFlowNames: [] })
        const flowsLine = noNames.split('\n').find((l) => l.startsWith('- Flows:'))
        expect(flowsLine).toBeDefined()
        expect(flowsLine).not.toContain('Recent:')
    })

    it('truncates long recent names', async () => {
        const longName = 'A'.repeat(60)
        const note = await buildNote({ totalFlows: 1, recentFlowNames: [longName] })
        expect(note).not.toContain(longName)
        expect(note).toContain('…')
    })

    it('lists connections by app sorted by count descending, with short piece names', async () => {
        const note = await buildNote({
            connectionsByPiece: [
                { pieceName: '@activepieces/piece-gmail', count: 2 },
                { pieceName: '@activepieces/piece-slack', count: 5 },
                { pieceName: '@activepieces/piece-attio', count: 3 },
            ],
        })
        expect(note).toContain('slack ×5, attio ×3, gmail ×2')
    })

    it('caps the connection list at 15 apps and notes the remainder (plural)', async () => {
        const note = await buildNote({ connectionsByPiece: pieces(18) })
        expect(note).toContain('(+3 more apps)')
        const connLine = note.split('\n').find((l) => l.startsWith('- Connections by app'))
        expect(connLine).toBeDefined()
        expect((connLine?.match(/×/g) ?? []).length).toBe(15)
    })

    it('uses singular "app" for a remainder of one', async () => {
        const note = await buildNote({ connectionsByPiece: pieces(16) })
        expect(note).toContain('(+1 more app)')
        expect(note).not.toContain('(+1 more apps)')
    })
})
