import { apId } from '@activepieces/core-utils'
import { AgentIcon, AgentVisibility, ColorName, DEFAULT_AGENT_MAX_STEPS } from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { databaseConnection } from '../../../../src/app/database/database-connection'
import { AgentEntity } from '../../../../src/app/ee/agent/agent-entity'
import { mockAndSaveBasicSetup } from '../../../helpers/mocks'
import { setupTestEnvironment } from '../../../helpers/test-setup'

let app: FastifyInstance

const repo = () => databaseConnection().getRepository(AgentEntity)

async function seedProject() {
    const { mockOwner, mockProject } = await mockAndSaveBasicSetup()
    return { user: mockOwner, project: mockProject }
}

function mockAgent(projectId: string, ownerId: string, overrides: Record<string, unknown> = {}) {
    return {
        id: apId(),
        projectId,
        ownerId,
        externalId: apId(),
        displayName: 'Marketing agent',
        description: null,
        icon: AgentIcon.SPARKLES,
        color: ColorName.PURPLE,
        visibility: AgentVisibility.PROJECT,
        sharedWithUserIds: [],
        draft: {
            instructions: 'Draft launch posts.',
            provider: null,
            modelName: null,
            maxSteps: DEFAULT_AGENT_MAX_STEPS,
            tools: [],
            structuredOutput: [],
        },
        published: null,
        ...overrides,
    }
}

beforeAll(async () => {
    app = await setupTestEnvironment()
})

afterAll(async () => {
    await app?.close()
})

describe('agent table', () => {
    it('leaves no trace of the orphaned 2025 agent_run table', async () => {
        const rows = await databaseConnection().query(
            "select table_name from information_schema.tables where table_schema = 'public' and table_name = 'agent_run'",
        )
        expect(rows).toHaveLength(0)
    })

    it('round-trips the draft config through jsonb without reshaping it', async () => {
        const { project, user } = await seedProject()
        const draft = {
            instructions: 'Check the brand guide first.',
            provider: null,
            modelName: 'claude-sonnet-4-6',
            maxSteps: 7,
            tools: [],
            structuredOutput: [{ displayName: 'summary', type: 'text' }],
        }
        const saved = await repo().save(mockAgent(project.id, user.id, { draft }))

        const found = await repo().findOneByOrFail({ id: saved.id })
        expect(found.draft).toStrictEqual(draft)
        expect(found.published).toBeNull()
    })

    it('defaults sharedWithUserIds to an empty array rather than null', async () => {
        const { project, user } = await seedProject()
        const agent = mockAgent(project.id, user.id)
        delete (agent as Record<string, unknown>).sharedWithUserIds
        const saved = await repo().save(agent)

        const found = await repo().findOneByOrFail({ id: saved.id })
        expect(found.sharedWithUserIds).toStrictEqual([])
    })

    it('stores the named members an agent is shared with', async () => {
        const { project, user } = await seedProject()
        const mate = apId()
        const saved = await repo().save(mockAgent(project.id, user.id, {
            visibility: AgentVisibility.RESTRICTED,
            sharedWithUserIds: [mate],
        }))

        const found = await repo().findOneByOrFail({ id: saved.id })
        expect(found.visibility).toBe(AgentVisibility.RESTRICTED)
        expect(found.sharedWithUserIds).toStrictEqual([mate])
    })

    it('lets two projects each own an agent with the same externalId', async () => {
        const first = await seedProject()
        const second = await seedProject()
        const externalId = 'marketing-agent'

        await repo().save(mockAgent(first.project.id, first.user.id, { externalId }))
        await expect(repo().save(mockAgent(second.project.id, second.user.id, { externalId }))).resolves.toBeDefined()
    })

    it('refuses a second agent with the same externalId inside one project', async () => {
        const { project, user } = await seedProject()
        const externalId = 'marketing-agent'

        await repo().save(mockAgent(project.id, user.id, { externalId }))
        await expect(repo().save(mockAgent(project.id, user.id, { externalId }))).rejects.toThrow()
    })

    it('deletes a project\'s agents with the project', async () => {
        const { project, user } = await seedProject()
        const saved = await repo().save(mockAgent(project.id, user.id))

        await databaseConnection().getRepository('project').delete({ id: project.id })

        expect(await repo().findOneBy({ id: saved.id })).toBeNull()
    })

    it('refuses to delete a user who still owns an agent, so published flows keep working', async () => {
        const { project, user } = await seedProject()
        await repo().save(mockAgent(project.id, user.id))

        await expect(databaseConnection().getRepository('user').delete({ id: user.id })).rejects.toThrow()
    })

    it('rejects an agent pointing at a project that does not exist', async () => {
        const { user } = await seedProject()
        await expect(repo().save(mockAgent(apId(), user.id))).rejects.toThrow()
    })
})
