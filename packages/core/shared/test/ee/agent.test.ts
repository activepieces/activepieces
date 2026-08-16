import { Permission } from '@activepieces/core-utils'
import { describe, expect, it } from 'vitest'
import { Agent, AgentConfig, AgentIcon, AgentVisibility, DEFAULT_AGENT_MAX_STEPS, MAX_AGENT_OUTPUT_FIELDS, MAX_AGENT_STEP_BUDGET, MAX_AGENT_TEXT_LENGTH, MAX_AGENT_TOOLS } from '../../src/lib/ee/agent/agent'
import { rolePermissions } from '../../src/lib/ee/authn/access-control-list'
import { ColorName } from '../../src/lib/management/project/project'
import { DefaultProjectRole } from '../../src/lib/management/project/project-member'

const apId = (seed: string) => seed.padEnd(21, '0').slice(0, 21)

const config = () => ({
    instructions: 'Draft launch posts.',
    provider: null,
    modelName: null,
    tools: [],
    structuredOutput: [],
})

const agent = () => ({
    id: apId('agent'),
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
    projectId: apId('project'),
    ownerId: apId('owner'),
    externalId: 'marketing-agent',
    displayName: 'Marketing agent',
    description: null,
    icon: AgentIcon.SPARKLES,
    color: ColorName.PURPLE,
    visibility: AgentVisibility.PROJECT,
    sharedWithUserIds: [],
    draft: { ...config(), maxSteps: DEFAULT_AGENT_MAX_STEPS },
    published: null,
})

describe('AgentConfig', () => {
    it('falls back to the default step budget when maxSteps is absent', () => {
        expect(AgentConfig.parse(config()).maxSteps).toBe(DEFAULT_AGENT_MAX_STEPS)
    })

    it('keeps an explicit maxSteps rather than overwriting it with the default', () => {
        expect(AgentConfig.parse({ ...config(), maxSteps: 3 }).maxSteps).toBe(3)
    })

    it('rejects a step budget above the ceiling, and accepts the ceiling itself', () => {
        expect(AgentConfig.safeParse({ ...config(), maxSteps: MAX_AGENT_STEP_BUDGET + 1 }).success).toBe(false)
        expect(AgentConfig.safeParse({ ...config(), maxSteps: MAX_AGENT_STEP_BUDGET }).success).toBe(true)
    })

    it('rejects a zero or negative step budget', () => {
        expect(AgentConfig.safeParse({ ...config(), maxSteps: 0 }).success).toBe(false)
        expect(AgentConfig.safeParse({ ...config(), maxSteps: -1 }).success).toBe(false)
    })

    it('accepts instructions at the shared text ceiling and rejects one character more', () => {
        expect(AgentConfig.safeParse({ ...config(), instructions: 'a'.repeat(MAX_AGENT_TEXT_LENGTH) }).success).toBe(true)
        expect(AgentConfig.safeParse({ ...config(), instructions: 'a'.repeat(MAX_AGENT_TEXT_LENGTH + 1) }).success).toBe(false)
    })

    it('uses the same text ceiling the flow-step run path uses, so neither can reject what the other accepts', () => {
        expect(MAX_AGENT_TEXT_LENGTH).toBe(51_200)
    })

    it('rejects more tools or output fields than a single turn may schedule', () => {
        expect(AgentConfig.safeParse({ ...config(), tools: new Array(MAX_AGENT_TOOLS + 1).fill({ type: 'PIECE', toolName: 't' }) }).success).toBe(false)
        expect(AgentConfig.safeParse({ ...config(), structuredOutput: new Array(MAX_AGENT_OUTPUT_FIELDS + 1).fill({ displayName: 'f', type: 'text' }) }).success).toBe(false)
    })
})

describe('Agent', () => {
    it('accepts a well-formed row', () => {
        expect(Agent.safeParse(agent()).success).toBe(true)
    })

    it('rejects an icon or colour outside the closed set, so the column cannot hold junk', () => {
        expect(Agent.safeParse({ ...agent(), icon: 'rocket' }).success).toBe(false)
        expect(Agent.safeParse({ ...agent(), color: 'BEIGE' }).success).toBe(false)
    })

    it('stores lucide names as icon values so the web needs no second mapping', () => {
        expect(AgentIcon.SPARKLES).toBe('sparkles')
        expect(AgentIcon.MESSAGE).toBe('message-square')
    })

    it('requires an owner and a project, since both drive who may see the agent', () => {
        const { ownerId: _o, ...noOwner } = agent()
        const { projectId: _p, ...noProject } = agent()
        expect(Agent.safeParse(noOwner).success).toBe(false)
        expect(Agent.safeParse(noProject).success).toBe(false)
    })

    it('rejects ids that are not ApIds, so a project cannot be addressed by an arbitrary string', () => {
        expect(Agent.safeParse({ ...agent(), projectId: 'not-an-ap-id' }).success).toBe(false)
        expect(Agent.safeParse({ ...agent(), sharedWithUserIds: ['nope'] }).success).toBe(false)
    })

    it('treats an unpublished agent as one with no published config', () => {
        const parsed = Agent.parse(agent())
        expect(parsed.published).toBeNull()
    })

    it('carries draft and published independently, so publishing cannot be inferred from the draft', () => {
        const parsed = Agent.parse({ ...agent(), draft: { ...config(), maxSteps: 5, instructions: 'new' }, published: { ...config(), maxSteps: 9, instructions: 'old' } })
        expect(parsed.draft.instructions).toBe('new')
        expect(parsed.published?.instructions).toBe('old')
    })

    it('allows every visibility state, including restricted with nobody named', () => {
        expect(Agent.safeParse({ ...agent(), visibility: AgentVisibility.RESTRICTED, sharedWithUserIds: [] }).success).toBe(true)
        expect(Agent.safeParse({ ...agent(), visibility: AgentVisibility.RESTRICTED, sharedWithUserIds: [apId('mate')] }).success).toBe(true)
        expect(Agent.safeParse({ ...agent(), visibility: 'PUBLIC' }).success).toBe(false)
    })
})

describe('agent role permissions', () => {
    it('lets admins and editors build agents', () => {
        for (const role of [DefaultProjectRole.ADMIN, DefaultProjectRole.EDITOR]) {
            expect(rolePermissions[role]).toContain(Permission.READ_AGENT)
            expect(rolePermissions[role]).toContain(Permission.WRITE_AGENT)
        }
    })

    it('lets viewers read agents but never write them', () => {
        expect(rolePermissions[DefaultProjectRole.VIEWER]).toContain(Permission.READ_AGENT)
        expect(rolePermissions[DefaultProjectRole.VIEWER]).not.toContain(Permission.WRITE_AGENT)
    })
})
