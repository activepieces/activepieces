import {
    AgentPieceProps,
    AIProviderName,
    FlowActionType,
    FlowTriggerType,
    FlowVersionState,
    flowStructureUtil,
    PrincipalType,
} from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { initializeDatabase } from '../../../../src/app/database'
import { databaseConnection } from '../../../../src/app/database/database-connection'
import { flowVersionMigrationService } from '../../../../src/app/flows/flow-version/flow-version-migration.service'
import { setupServer } from '../../../../src/app/server'
import { generateMockToken } from '../../../helpers/auth'
import {
    createMockFlow,
    createMockFlowVersion,
    mockAndSaveBasicSetup,
} from '../../../helpers/mocks'

let app: FastifyInstance | null = null

beforeAll(async () => {
    await initializeDatabase({ runMigrations: false })
    app = await setupServer()
})

afterAll(async () => {
    await databaseConnection().destroy()
    await app?.close()
})

const AI_PIECE_NAME = '@activepieces/piece-ai'

function makeAiTriggerWithStep(aiProviderModel: { provider: AIProviderName, model: string }) {
    return {
        type: FlowTriggerType.PIECE,
        name: 'trigger',
        displayName: 'Schedule',
        settings: {
            pieceName: '@activepieces/piece-schedule',
            pieceVersion: '0.1.5',
            triggerName: 'every_hour',
            input: {},
            propertySettings: {},
        },
        valid: true,
        nextAction: {
            type: FlowActionType.PIECE,
            name: 'step_1',
            displayName: 'AI Agent',
            settings: {
                pieceName: AI_PIECE_NAME,
                pieceVersion: '0.1.0',
                actionName: 'run_agent',
                input: {
                    [AgentPieceProps.AI_PROVIDER_MODEL]: aiProviderModel,
                },
                propertySettings: {},
            },
            valid: true,
            nextAction: {
                type: FlowActionType.PIECE,
                name: 'step_2',
                displayName: 'Ask AI',
                settings: {
                    pieceName: AI_PIECE_NAME,
                    pieceVersion: '0.1.5',
                    actionName: 'askAi',
                    input: {
                        provider: aiProviderModel.provider,
                        model: aiProviderModel.model,
                    },
                    propertySettings: {},
                },
                valid: true,
            },
        },
    } as const
}

describe('Flow Version API', () => {
    describe('POST /v1/flows/versions/migrate-ai-model', () => {
        it('enqueues migration job and returns a jobId', async () => {
            const { mockProject, mockOwner, mockPlatform } = await mockAndSaveBasicSetup()
            const mockToken = await generateMockToken({
                type: PrincipalType.USER,
                id: mockOwner.id,
                platform: { id: mockPlatform.id },
            })

            const mockFlow = createMockFlow({ projectId: mockProject.id })
            await databaseConnection().getRepository('flow').save(mockFlow)
            await databaseConnection().getRepository('flow_version').save(
                createMockFlowVersion({
                    flowId: mockFlow.id,
                    state: FlowVersionState.DRAFT,
                    trigger: makeAiTriggerWithStep({ provider: AIProviderName.OPENAI, model: 'gpt-4' }) as never,
                }),
            )

            const response = await app?.inject({
                method: 'POST',
                url: '/v1/flows/versions/migrate-ai-model',
                headers: { authorization: `Bearer ${mockToken}` },
                body: {
                    sourceModel: { provider: AIProviderName.OPENAI, model: 'gpt-4' },
                    targetModel: { provider: AIProviderName.ANTHROPIC, model: 'claude-3-opus' },
                },
            })

            expect(response?.statusCode).toBe(StatusCodes.NO_CONTENT)
            expect(response?.json().jobId).toMatch(/^migrate-flow-model-/)
        })
    })

    describe('migrateFlowsModelHandler', () => {
        it('migrates step_1 (run_agent) and step_2 (askAi) matching the source model', async () => {
            const { mockProject, mockPlatform } = await mockAndSaveBasicSetup()

            const sourceModel = { provider: AIProviderName.OPENAI, model: 'gpt-4' }
            const targetModel = { provider: AIProviderName.ANTHROPIC, model: 'claude-3-opus' }

            const mockFlow = createMockFlow({ projectId: mockProject.id })
            await databaseConnection().getRepository('flow').save(mockFlow)
            await databaseConnection().getRepository('flow_version').save(
                createMockFlowVersion({
                    flowId: mockFlow.id,
                    state: FlowVersionState.DRAFT,
                    trigger: makeAiTriggerWithStep(sourceModel) as never,
                }),
            )

            await flowVersionMigrationService.migrateFlowsModelHandler({
                jobId: 'test-job-id',
                platformId: mockPlatform.id,
                request: { sourceModel, targetModel },
            })

            const versions = await databaseConnection()
                .getRepository('flow_version')
                .find({ where: { flowId: mockFlow.id }, order: { created: 'DESC' } })
            expect(versions).toHaveLength(2)

            const newVersion = versions[0]
            expect(newVersion.state).toBe(FlowVersionState.LOCKED)

            const allSteps = flowStructureUtil.getAllSteps(newVersion.trigger)

            // step_1 uses AgentPieceProps.AI_PROVIDER_MODEL — should be migrated to targetModel
            const step1 = allSteps.find(s => s.name === 'step_1')
            expect((step1?.settings.input as Record<string, unknown>)[AgentPieceProps.AI_PROVIDER_MODEL]).toEqual(targetModel)

            // step_2 uses input.provider / input.model directly — also migrated
            const step2 = allSteps.find(s => s.name === 'step_2')
            const step2Input = step2?.settings.input as Record<string, unknown>
            expect(step2Input.provider).toBe(targetModel.provider)
            expect(step2Input.model).toBe(targetModel.model)

            const updatedFlow = await databaseConnection()
                .getRepository('flow')
                .findOneBy({ id: mockFlow.id })
            expect(updatedFlow?.publishedVersionId).toBe(newVersion.id)
        })

        it('does not migrate flows whose model does not match the source', async () => {
            const { mockProject, mockPlatform } = await mockAndSaveBasicSetup()

            const mockFlow = createMockFlow({ projectId: mockProject.id })
            await databaseConnection().getRepository('flow').save(mockFlow)
            await databaseConnection().getRepository('flow_version').save(
                createMockFlowVersion({
                    flowId: mockFlow.id,
                    state: FlowVersionState.DRAFT,
                    trigger: makeAiTriggerWithStep({ provider: AIProviderName.OPENAI, model: 'gpt-3.5-turbo' }) as never,
                }),
            )

            await flowVersionMigrationService.migrateFlowsModelHandler({
                jobId: 'test-job-id',
                platformId: mockPlatform.id,
                request: {
                    sourceModel: { provider: AIProviderName.OPENAI, model: 'gpt-4' },
                    targetModel: { provider: AIProviderName.ANTHROPIC, model: 'claude-3-opus' },
                },
            })

            const versions = await databaseConnection()
                .getRepository('flow_version')
                .find({ where: { flowId: mockFlow.id } })
            expect(versions).toHaveLength(1)
        })

        it('only migrates flows within the specified projectIds', async () => {
            const { mockPlatform, mockOwner, mockProject: projectA } = await mockAndSaveBasicSetup()
            const { mockProject: projectB } = await mockAndSaveBasicSetup({
                platform: { id: mockPlatform.id, ownerId: mockOwner.id },
            })

            const sourceModel = { provider: AIProviderName.OPENAI, model: 'gpt-4' }
            const targetModel = { provider: AIProviderName.ANTHROPIC, model: 'claude-3-opus' }

            const flowA = createMockFlow({ projectId: projectA.id })
            const flowB = createMockFlow({ projectId: projectB.id })
            await databaseConnection().getRepository('flow').save([flowA, flowB])
            await databaseConnection().getRepository('flow_version').save([
                createMockFlowVersion({ flowId: flowA.id, state: FlowVersionState.DRAFT, trigger: makeAiTriggerWithStep(sourceModel) as never }),
                createMockFlowVersion({ flowId: flowB.id, state: FlowVersionState.DRAFT, trigger: makeAiTriggerWithStep(sourceModel) as never }),
            ])

            await flowVersionMigrationService.migrateFlowsModelHandler({
                jobId: 'test-job-id',
                platformId: mockPlatform.id,
                request: { projectIds: [projectA.id], sourceModel, targetModel },
            })

            // flowA should be migrated
            const flowAVersions = await databaseConnection().getRepository('flow_version').find({ where: { flowId: flowA.id } })
            expect(flowAVersions).toHaveLength(2)

            // flowB should be untouched
            const flowBVersions = await databaseConnection().getRepository('flow_version').find({ where: { flowId: flowB.id } })
            expect(flowBVersions).toHaveLength(1)
        })

        it('does not migrate flows from other platforms', async () => {
            const { mockPlatform: platformA } = await mockAndSaveBasicSetup()
            const { mockProject: projectB } = await mockAndSaveBasicSetup()

            const sourceModel = { provider: AIProviderName.OPENAI, model: 'gpt-4' }
            const targetModel = { provider: AIProviderName.ANTHROPIC, model: 'claude-3-opus' }

            const flowB = createMockFlow({ projectId: projectB.id })
            await databaseConnection().getRepository('flow').save(flowB)
            await databaseConnection().getRepository('flow_version').save(
                createMockFlowVersion({ flowId: flowB.id, state: FlowVersionState.DRAFT, trigger: makeAiTriggerWithStep(sourceModel) as never }),
            )

            // Run handler as platformA — should not touch platformB's flows
            await flowVersionMigrationService.migrateFlowsModelHandler({
                jobId: 'test-job-id',
                platformId: platformA.id,
                request: { sourceModel, targetModel },
            })

            const versions = await databaseConnection().getRepository('flow_version').find({ where: { flowId: flowB.id } })
            expect(versions).toHaveLength(1)
        })

        it('uses the latest flow version regardless of its state', async () => {
            const { mockProject, mockPlatform } = await mockAndSaveBasicSetup()

            const sourceModel = { provider: AIProviderName.OPENAI, model: 'gpt-4' }
            const targetModel = { provider: AIProviderName.ANTHROPIC, model: 'claude-3-opus' }

            const mockFlow = createMockFlow({ projectId: mockProject.id })
            await databaseConnection().getRepository('flow').save(mockFlow)

            // Older version with a different model
            const olderVersion = createMockFlowVersion({
                flowId: mockFlow.id,
                state: FlowVersionState.DRAFT,
                created: new Date(Date.now() - 10000).toISOString(),
                trigger: makeAiTriggerWithStep({ provider: AIProviderName.GOOGLE, model: 'gemini-pro' }) as never,
            })
            // Latest version with the matching model
            const latestVersion = createMockFlowVersion({
                flowId: mockFlow.id,
                state: FlowVersionState.LOCKED,
                created: new Date().toISOString(),
                trigger: makeAiTriggerWithStep(sourceModel) as never,
            })
            await databaseConnection().getRepository('flow_version').save([olderVersion, latestVersion])

            await flowVersionMigrationService.migrateFlowsModelHandler({
                jobId: 'test-job-id',
                platformId: mockPlatform.id,
                request: { sourceModel, targetModel },
            })

            const versions = await databaseConnection()
                .getRepository('flow_version')
                .find({ where: { flowId: mockFlow.id }, order: { created: 'DESC' } })
            expect(versions).toHaveLength(3)

            const newVersion = versions[0]
            expect(newVersion.state).toBe(FlowVersionState.LOCKED)

            const allSteps = flowStructureUtil.getAllSteps(newVersion.trigger)
            const step1 = allSteps.find(s => s.name === 'step_1')
            expect((step1?.settings.input as Record<string, unknown>)[AgentPieceProps.AI_PROVIDER_MODEL]).toEqual(targetModel)

            const step2 = allSteps.find(s => s.name === 'step_2')
            const step2Input = step2?.settings.input as Record<string, unknown>
            expect(step2Input.provider).toBe(targetModel.provider)
            expect(step2Input.model).toBe(targetModel.model)
        })
    })
})
