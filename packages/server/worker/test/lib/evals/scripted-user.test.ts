import { describe, expect, it, vi } from 'vitest'
import { ProjectConnection, scriptedUser } from './scripted-user'

describe('scriptedUser', () => {
    it('picks the project connection for the piece on a connection card', async () => {
        const listConnections = vi.fn(async (): Promise<ProjectConnection[]> => [
            { externalId: 'old', displayName: 'Old Slack', status: 'ERROR' },
            { externalId: 'slack-1', displayName: 'Team Slack', status: 'ACTIVE' },
        ])
        const user = scriptedUser.create({ answers: { questions: null, connections: {} }, listConnections, projectId: 'proj-1' })

        await user.onGateOpened({ gateId: 'g1', toolName: 'ap_show_connection_picker', displayName: 'Slack', toolInput: { piece: 'slack', displayName: 'Slack' } })
        const decision = await user.waitForApproval({ gateId: 'g1' })

        expect(decision).toEqual({ outcome: 'approved', payload: expect.objectContaining({ connectionExternalId: 'slack-1', label: 'Team Slack' }) })
        expect(user.cardsShown()).toEqual(['ap_show_connection_picker'])
    })

    it('dismisses the card when the case says the user has no connection', async () => {
        const listConnections = vi.fn(async (): Promise<ProjectConnection[]> => [])
        const user = scriptedUser.create({ answers: { questions: null, connections: { '@activepieces/piece-hubspot': 'none' } }, listConnections, projectId: 'proj-1' })

        await user.onGateOpened({ gateId: 'g1', toolName: 'ap_show_connection_picker', displayName: 'HubSpot', toolInput: { piece: 'hubspot', displayName: 'HubSpot' } })

        expect(await user.waitForApproval({ gateId: 'g1' })).toEqual({ outcome: 'declined' })
        expect(listConnections).not.toHaveBeenCalled()
    })

    it('answers question cards with the case answer, or sensible defaults', async () => {
        const listConnections = vi.fn(async (): Promise<ProjectConnection[]> => [])
        const withAnswer = scriptedUser.create({ answers: { questions: 'every Monday at 9', connections: {} }, listConnections, projectId: 'proj-1' })
        const withDefault = scriptedUser.create({ answers: { questions: null, connections: {} }, listConnections, projectId: 'proj-1' })

        await withAnswer.onGateOpened({ gateId: 'q', toolName: 'ap_show_questions', displayName: 'Questions', toolInput: {} })
        await withDefault.onGateOpened({ gateId: 'q', toolName: 'ap_show_questions', displayName: 'Questions', toolInput: {} })

        expect(await withAnswer.waitForApproval({ gateId: 'q' })).toEqual({ outcome: 'approved', payload: { answers: 'every Monday at 9' } })
        expect(await withDefault.waitForApproval({ gateId: 'q' })).toEqual({ outcome: 'approved', payload: { answers: expect.stringContaining('sensible defaults') } })
    })

    it('names the connections a live case needs that the base project lacks, so the case is skipped', async () => {
        const listConnections = vi.fn(async (pieceName: string): Promise<ProjectConnection[]> => pieceName === '@activepieces/piece-slack'
            ? [{ externalId: 'slack-1', displayName: 'Team Slack', status: 'ACTIVE' }]
            : [])

        const missing = await scriptedUser.missingConnections({ answers: { questions: null, connections: { slack: 'Team Slack', gmail: 'Work Gmail', hubspot: 'none' } }, listConnections })

        expect(missing).toEqual(['Work Gmail'])
        expect(listConnections).not.toHaveBeenCalledWith('@activepieces/piece-hubspot')
    })

    it('counts a connection it could not list as missing', async () => {
        const listConnections = vi.fn(async (): Promise<ProjectConnection[]> => {
            throw new Error('no ap_list_connections')
        })

        expect(await scriptedUser.missingConnections({ answers: { questions: null, connections: { slack: 'Team Slack' } }, listConnections })).toEqual(['Team Slack'])
    })
})
