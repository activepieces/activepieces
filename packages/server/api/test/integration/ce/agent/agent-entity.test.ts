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
    it('defaults sharedWithUserIds to an empty array, since typeorm sends an explicit null rather than omitting it', async () => {
        const { project, user } = await seedProject()
        const saved = await repo().save(mockAgent(project.id, user.id))

        expect((await repo().findOneByOrFail({ id: saved.id })).sharedWithUserIds).toStrictEqual([])
    })

    it('scopes externalId to the project, so two projects may hold the same one', async () => {
        const first = await seedProject()
        const second = await seedProject()
        const externalId = 'marketing-agent'

        await repo().save(mockAgent(first.project.id, first.user.id, { externalId }))
        await expect(repo().save(mockAgent(second.project.id, second.user.id, { externalId }))).resolves.toBeDefined()
        await expect(repo().save(mockAgent(first.project.id, first.user.id, { externalId }))).rejects.toThrow()
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
})
