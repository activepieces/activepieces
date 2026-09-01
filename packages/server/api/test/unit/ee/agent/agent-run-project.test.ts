import { Project } from '@activepieces/shared'
import { describe, expect, it } from 'vitest'
import { agentHelpers } from '../../../../src/app/ee/agent/agent-helpers'

const project = (id: string): Project => ({ id } as Project)

describe('agentHelpers.selectRunProject', () => {
    it('runs where the agent lives, even when the conversation still records the old project', () => {
        const chosen = agentHelpers.selectRunProject({
            conversationProjectId: 'project_left_behind',
            agentProjectId: 'project_agent_moved_to',
            projects: [project('project_left_behind'), project('project_agent_moved_to')],
        })

        expect(chosen).toBe('project_agent_moved_to')
    })

    it('never pulls a run into a project the caller cannot reach', () => {
        const chosen = agentHelpers.selectRunProject({
            conversationProjectId: 'project_mine',
            agentProjectId: 'project_someone_elses',
            projects: [project('project_mine')],
        })

        expect(chosen).toBe('project_mine')
    })

    it('falls back to the first reachable project when neither is reachable', () => {
        const chosen = agentHelpers.selectRunProject({
            conversationProjectId: 'project_gone',
            agentProjectId: 'project_also_gone',
            projects: [project('project_mine')],
        })

        expect(chosen).toBe('project_mine')
    })

    it('keeps the conversation project for a chat with no agent behind it', () => {
        const chosen = agentHelpers.selectRunProject({
            conversationProjectId: 'project_mine',
            agentProjectId: null,
            projects: [project('project_other'), project('project_mine')],
        })

        expect(chosen).toBe('project_mine')
    })
})
