import { describe, expect, it, vi } from 'vitest'
import { ProjectConnection } from './scripted-user'
import { seedConnections } from './seed-connections'

describe('seedConnections.resolve', () => {
    const connections: ProjectConnection[] = [
        { externalId: 'slack-old', displayName: 'Old Slack', status: 'ERROR' },
        { externalId: 'slack-team', displayName: 'Team Slack', status: 'ACTIVE' },
    ]
    const listConnections = vi.fn(async (pieceName: string): Promise<ProjectConnection[]> => pieceName === '@activepieces/piece-slack' ? connections : [])

    it('turns every way a seed names a connection into its plain externalId', async () => {
        const flow = {
            flowName: 'Lead alerts',
            trigger: { pieceName: '@activepieces/piece-webhook', triggerName: 'catch_webhook' },
            steps: [
                { name: 'a', pieceName: 'slack', actionName: 'send_message', auth: '{{connection:slack}}' },
                { name: 'b', pieceName: 'slack', actionName: 'send_message', auth: '{{connections[\'Team Slack\']}}' },
                { name: 'c', pieceName: 'slack', actionName: 'send_message', auth: 'Old Slack' },
                { name: 'd', pieceName: 'slack', actionName: 'send_message', auth: 'slack-team' },
            ],
        }

        const resolved = await seedConnections.resolve({ flows: [flow], answers: { questions: null, connections: {} }, listConnections })

        expect(resolved.unmet).toEqual([])
        expect(resolved.flows[0]['steps']).toEqual([
            expect.objectContaining({ name: 'a', auth: 'slack-team' }),
            expect.objectContaining({ name: 'b', auth: 'slack-team' }),
            expect.objectContaining({ name: 'c', auth: 'slack-old' }),
            expect.objectContaining({ name: 'd', auth: 'slack-team' }),
        ])
        expect(resolved.flows[0]['trigger']).toEqual(flow.trigger)
    })

    it('uses the case\'s connection pick for a piece-only reference', async () => {
        const flow = { flowName: 'F', steps: [{ pieceName: 'slack', auth: '{{connection:slack}}' }] }

        const resolved = await seedConnections.resolve({ flows: [flow], answers: { questions: null, connections: { slack: 'Old Slack' } }, listConnections })

        expect(resolved.flows[0]['steps']).toEqual([expect.objectContaining({ auth: 'slack-old' })])
    })

    it('names the connection a seed needs that the workspace lacks, or the real listing error', async () => {
        const flows = [{ flowName: 'F', steps: [{ pieceName: 'slack', auth: 'Sales Slack' }, { pieceName: 'gmail', auth: '{{connection:gmail}}' }] }]
        const failing = vi.fn(async (pieceName: string): Promise<ProjectConnection[]> => {
            if (pieceName === '@activepieces/piece-gmail') {
                throw new Error('MCP closed')
            }
            return connections
        })

        expect(await seedConnections.unmet({ flows, answers: { questions: null, connections: {} }, listConnections: failing })).toEqual([
            'needs connection "Sales Slack" (@activepieces/piece-slack)',
            'could not list @activepieces/piece-gmail connections to find "gmail": MCP closed',
        ])
    })

    it('treats a piece the case declines as missing', async () => {
        const flows = [{ flowName: 'F', steps: [{ pieceName: 'slack', auth: '{{connection:slack}}' }] }]

        expect(await seedConnections.unmet({ flows, answers: { questions: null, connections: { slack: 'none' } }, listConnections })).toEqual(['needs connection "slack" (@activepieces/piece-slack)'])
    })
})
