import { AgentIcon, AgentVisibility, ColorName } from '@activepieces/shared'
import { describe, expect, it } from 'vitest'
import { agentUpdatePayload } from '../../../../src/app/ee/agent/agent-service'

const draft = {
    instructions: 'Sort the inbox.',
    provider: null,
    modelName: null,
    providerConfigId: null,
    maxSteps: 5,
    tools: [],
    structuredOutput: [],
}

describe('agentUpdatePayload', () => {
    it('writes only what an edit owns, so a move cannot be undone by a save', () => {
        const payload = agentUpdatePayload({
            id: 'agent_1',
            request: {
                displayName: 'Renamed',
                icon: AgentIcon.MAIL,
                color: ColorName.BLUE,
                goLive: true,
            },
            draft,
            published: null,
            visibility: AgentVisibility.PROJECT,
            sharedWithUserIds: [],
        })

        expect(Object.keys(payload).sort()).toStrictEqual([
            'color',
            'displayName',
            'draft',
            'icon',
            'id',
            'published',
            'sharedWithUserIds',
            'visibility',
        ])
        expect('projectId' in payload).toBe(false)
        expect('ownerId' in payload).toBe(false)
        expect('externalId' in payload).toBe(false)
        expect('goLive' in payload).toBe(false)
    })

    it('keeps the resolved draft and share rather than the raw request copies', () => {
        const payload = agentUpdatePayload({
            id: 'agent_1',
            request: { draft: { ...draft, instructions: 'stale' }, sharedWithUserIds: ['user_stale'] },
            draft,
            published: draft,
            visibility: AgentVisibility.RESTRICTED,
            sharedWithUserIds: ['user_resolved'],
        })

        expect(payload.draft?.instructions).toBe('Sort the inbox.')
        expect(payload.sharedWithUserIds).toStrictEqual(['user_resolved'])
        expect(payload.published).not.toBeNull()
    })
})
