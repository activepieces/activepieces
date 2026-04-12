import {
    AgentPieceProps,
    AIProviderName,
    apId,
    FlowActionType,
    FlowMigrationStatus,
    FlowMigrationType,
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
                url: '/api/v1/flows/versions/migrate-ai-model',
                headers: { authorization: `Bearer ${mockToken}` },
                body: {
                    sourceModel: { provider: AIProviderName.OPENAI, model: 'gpt-4' },
                    targetModel: { provider: AIProviderName.ANTHROPIC, model: 'claude-3-opus' },
                },
            })

            expect(response?.statusCode).toBe(StatusCodes.OK)
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

            const migrationId = apId()
            await databaseConnection().getRepository('flow_migration').save({
                id: migrationId,
                platformId: mockPlatform.id,
                userId: apId(),
                type: FlowMigrationType.AI_PROVIDER_MODEL,
                status: FlowMigrationStatus.RUNNING,
                migratedVersions: [],
                failedFlowVersions: [],
                params: {
                    sourceModel,
                    targetModel,
                    projectIds: null,
                },
            })

            await flowVersionMigrationService(app!.log).migrateFlowsModelHandler({
                jobId: 'test-job-id',
                migrationId,
                platformId: mockPlatform.id,
                userId: 'test-user-id',
                request: { sourceModel, targetModel },
            })

            const versions = await databaseConnection()
                .getRepository('flow_version')
                .find({ where: { flowId: mockFlow.id }, order: { created: 'DESC' } })
            expect(versions).toHaveLength(2)

            const newVersion = versions[0]
            expect(newVersion.state).toBe(FlowVersionState.DRAFT)

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

            // publishedVersionId should not be updated, because the flow is still in draft state
            expect(updatedFlow?.publishedVersionId).toBe(mockFlow.publishedVersionId)
        })

        it('does not migrate flows whose model does not match the source', async () => {
            const { mockProject, mockPlatform } = await mockAndSaveBasicSetup()

            const sourceModel = { provider: AIProviderName.OPENAI, model: 'gpt-4' }
            const targetModel = { provider: AIProviderName.ANTHROPIC, model: 'claude-3-opus' }

            const mockFlow = createMockFlow({ projectId: mockProject.id })
            await databaseConnection().getRepository('flow').save(mockFlow)
            await databaseConnection().getRepository('flow_version').save(
                createMockFlowVersion({
                    flowId: mockFlow.id,
                    state: FlowVersionState.LOCKED,
                    trigger: makeAiTriggerWithStep({ provider: AIProviderName.OPENAI, model: 'gpt-3.5-turbo' }) as never,
                }),
            )

            const migrationId = apId()
            await databaseConnection().getRepository('flow_migration').save({
                id: migrationId,
                platformId: mockPlatform.id,
                userId: apId(),
                type: FlowMigrationType.AI_PROVIDER_MODEL,
                status: FlowMigrationStatus.RUNNING,
                migratedVersions: [],
                failedFlowVersions: [],
                params: {
                    sourceModel,
                    targetModel,
                    projectIds: null,
                },
            })

            await flowVersionMigrationService(app!.log).migrateFlowsModelHandler({
                jobId: 'test-job-id',
                migrationId,
                platformId: mockPlatform.id,
                userId: 'test-user-id',
                request: { sourceModel, targetModel },
            })

            const versions = await databaseConnection()
                .getRepository('flow_version')
                .find({ where: { flowId: mockFlow.id } })
            expect(versions).toHaveLength(1)
            const newVersion = versions[0]
            expect(newVersion.state).toBe(FlowVersionState.LOCKED)
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

            const migrationId = apId()
            await databaseConnection().getRepository('flow_migration').save({
                id: migrationId,
                platformId: mockPlatform.id,
                userId: apId(),
                type: FlowMigrationType.AI_PROVIDER_MODEL,
                status: FlowMigrationStatus.RUNNING,
                migratedVersions: [],
                failedFlowVersions: [],
                params: {
                    sourceModel,
                    targetModel,
                    projectIds: [projectA.id],
                },
            })

            await flowVersionMigrationService(app!.log).migrateFlowsModelHandler({
                jobId: 'test-job-id',
                migrationId,
                platformId: mockPlatform.id,
                userId: 'test-user-id',
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

            const migrationId = apId()
            await databaseConnection().getRepository('flow_migration').save({
                id: migrationId,
                platformId: platformA.id,
                userId: apId(),
                type: FlowMigrationType.AI_PROVIDER_MODEL,
                status: FlowMigrationStatus.RUNNING,
                migratedVersions: [],
                failedFlowVersions: [],
                params: {
                    sourceModel,
                    targetModel,
                    projectIds: null,
                },
            })

            // Run handler as platformA — should not touch platformB's flows
            await flowVersionMigrationService(app!.log).migrateFlowsModelHandler({
                jobId: 'test-job-id',
                migrationId,
                platformId: platformA.id,
                userId: 'test-user-id',
                request: { sourceModel, targetModel },
            })

            const versions = await databaseConnection().getRepository('flow_version').find({ where: { flowId: flowB.id } })
            expect(versions).toHaveLength(1)
        })

        it('never creates duplicate drafts for a single flow', async () => {
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

            const migrationId = apId()
            await databaseConnection().getRepository('flow_migration').save({
                id: migrationId,
                platformId: mockPlatform.id,
                userId: apId(),
                type: FlowMigrationType.AI_PROVIDER_MODEL,
                status: FlowMigrationStatus.RUNNING,
                migratedVersions: [],
                failedFlowVersions: [],
                params: {
                    sourceModel,
                    targetModel,
                    projectIds: null,
                },
            })

            await flowVersionMigrationService(app!.log).migrateFlowsModelHandler({
                jobId: 'test-job-id',
                migrationId,
                platformId: mockPlatform.id,
                userId: 'test-user-id',
                request: { sourceModel, targetModel },
            })

            const versions = await databaseConnection()
                .getRepository('flow_version')
                .find({ where: { flowId: mockFlow.id } })

            const draftVersions = versions.filter(v => v.state === FlowVersionState.DRAFT)
            const lockedVersions = versions.filter(v => v.state === FlowVersionState.LOCKED)

            expect(versions).toHaveLength(2)
            expect(draftVersions).toHaveLength(1)
            expect(lockedVersions).toHaveLength(1)
        })

        it('never creates duplicate drafts when flow has both draft and published versions', async () => {
            const { mockProject, mockPlatform } = await mockAndSaveBasicSetup()

            const sourceModel = { provider: AIProviderName.OPENAI, model: 'gpt-4' }
            const targetModel = { provider: AIProviderName.ANTHROPIC, model: 'claude-3-opus' }

            const publishedVersion = createMockFlowVersion({
                state: FlowVersionState.LOCKED,
                trigger: makeAiTriggerWithStep(sourceModel) as never,
            })
            const mockFlow = createMockFlow({
                projectId: mockProject.id,
                publishedVersionId: publishedVersion.id,
            })
            publishedVersion.flowId = mockFlow.id

            const draftVersion = createMockFlowVersion({
                flowId: mockFlow.id,
                state: FlowVersionState.DRAFT,
                trigger: makeAiTriggerWithStep(sourceModel) as never,
            })

            await databaseConnection().getRepository('flow').save(mockFlow)
            await databaseConnection().getRepository('flow_version').save([publishedVersion, draftVersion])

            const migrationId = apId()
            await databaseConnection().getRepository('flow_migration').save({
                id: migrationId,
                platformId: mockPlatform.id,
                userId: apId(),
                type: FlowMigrationType.AI_PROVIDER_MODEL,
                status: FlowMigrationStatus.RUNNING,
                migratedVersions: [],
                failedFlowVersions: [],
                params: {
                    sourceModel,
                    targetModel,
                    projectIds: null,
                },
            })

            await flowVersionMigrationService(app!.log).migrateFlowsModelHandler({
                jobId: 'test-job-id',
                migrationId,
                platformId: mockPlatform.id,
                userId: 'test-user-id',
                request: { sourceModel, targetModel },
            })

            const versions = await databaseConnection()
                .getRepository('flow_version')
                .find({ where: { flowId: mockFlow.id } })

            const draftVersions = versions.filter(v => v.state === FlowVersionState.DRAFT)
            expect(draftVersions).toHaveLength(1)

            const updatedFlow = await databaseConnection()
                .getRepository('flow')
                .findOneBy({ id: mockFlow.id })
            expect(updatedFlow?.publishedVersionId).not.toBe(publishedVersion.id)

            const newPublished = versions.find(v => v.id === updatedFlow?.publishedVersionId)
            expect(newPublished).toBeDefined()
            expect(newPublished?.state).toBe(FlowVersionState.LOCKED)

            const draftCreated = new Date(draftVersions[0].created).getTime()
            const publishedCreated = new Date(newPublished!.created).getTime()
            expect(draftCreated).toBeGreaterThan(publishedCreated)

            const newPublishedSteps = flowStructureUtil.getAllSteps(newPublished!.trigger)
            const step1 = newPublishedSteps.find(s => s.name === 'step_1')
            expect((step1?.settings.input as Record<string, unknown>)[AgentPieceProps.AI_PROVIDER_MODEL]).toEqual(targetModel)
        })

        it('is idempotent — running migration twice does not create extra versions', async () => {
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

            const migrationId1 = apId()
            await databaseConnection().getRepository('flow_migration').save({
                id: migrationId1,
                platformId: mockPlatform.id,
                userId: apId(),
                type: FlowMigrationType.AI_PROVIDER_MODEL,
                status: FlowMigrationStatus.RUNNING,
                migratedVersions: [],
                failedFlowVersions: [],
                params: {
                    sourceModel,
                    targetModel,
                    projectIds: null,
                },
            })

            await flowVersionMigrationService(app!.log).migrateFlowsModelHandler({
                jobId: 'test-job-id-1',
                migrationId: migrationId1,
                platformId: mockPlatform.id,
                userId: 'test-user-id',
                request: { sourceModel, targetModel },
            })

            const versionsAfterFirst = await databaseConnection()
                .getRepository('flow_version')
                .find({ where: { flowId: mockFlow.id } })
            expect(versionsAfterFirst).toHaveLength(2)

            const migrationId2 = apId()
            await databaseConnection().getRepository('flow_migration').save({
                id: migrationId2,
                platformId: mockPlatform.id,
                userId: apId(),
                type: FlowMigrationType.AI_PROVIDER_MODEL,
                status: FlowMigrationStatus.RUNNING,
                migratedVersions: [],
                failedFlowVersions: [],
                params: {
                    sourceModel,
                    targetModel,
                    projectIds: null,
                },
            })

            await flowVersionMigrationService(app!.log).migrateFlowsModelHandler({
                jobId: 'test-job-id-2',
                migrationId: migrationId2,
                platformId: mockPlatform.id,
                userId: 'test-user-id',
                request: { sourceModel, targetModel },
            })

            const versionsAfterSecond = await databaseConnection()
                .getRepository('flow_version')
                .find({ where: { flowId: mockFlow.id } })
            expect(versionsAfterSecond).toHaveLength(2)

            const draftVersions = versionsAfterSecond.filter(v => v.state === FlowVersionState.DRAFT)
            expect(draftVersions).toHaveLength(1)
        })

        it('updates publishedVersionId to point to a valid migrated version', async () => {
            const { mockProject, mockPlatform } = await mockAndSaveBasicSetup()

            const sourceModel = { provider: AIProviderName.OPENAI, model: 'gpt-4' }
            const targetModel = { provider: AIProviderName.ANTHROPIC, model: 'claude-3-opus' }

            const publishedVersion = createMockFlowVersion({
                state: FlowVersionState.LOCKED,
                trigger: makeAiTriggerWithStep(sourceModel) as never,
            })
            const mockFlow = createMockFlow({
                projectId: mockProject.id,
                publishedVersionId: publishedVersion.id,
            })
            publishedVersion.flowId = mockFlow.id

            await databaseConnection().getRepository('flow').save(mockFlow)
            await databaseConnection().getRepository('flow_version').save(publishedVersion)

            const migrationId = apId()
            await databaseConnection().getRepository('flow_migration').save({
                id: migrationId,
                platformId: mockPlatform.id,
                userId: apId(),
                type: FlowMigrationType.AI_PROVIDER_MODEL,
                status: FlowMigrationStatus.RUNNING,
                migratedVersions: [],
                failedFlowVersions: [],
                params: {
                    sourceModel,
                    targetModel,
                    projectIds: null,
                },
            })

            await flowVersionMigrationService(app!.log).migrateFlowsModelHandler({
                jobId: 'test-job-id',
                migrationId,
                platformId: mockPlatform.id,
                userId: 'test-user-id',
                request: { sourceModel, targetModel },
            })

            const updatedFlow = await databaseConnection()
                .getRepository('flow')
                .findOneBy({ id: mockFlow.id })
            expect(updatedFlow?.publishedVersionId).not.toBe(publishedVersion.id)

            const newPublished = await databaseConnection()
                .getRepository('flow_version')
                .findOneBy({ id: updatedFlow!.publishedVersionId! })
            expect(newPublished).toBeDefined()
            expect(newPublished?.state).toBe(FlowVersionState.LOCKED)

            const allSteps = flowStructureUtil.getAllSteps(newPublished!.trigger)
            const step1 = allSteps.find(s => s.name === 'step_1')
            expect((step1?.settings.input as Record<string, unknown>)[AgentPieceProps.AI_PROVIDER_MODEL]).toEqual(targetModel)
        })

        it('migrates all flows across multiple batches (>100 flows)', async () => {
            const { mockProject, mockPlatform } = await mockAndSaveBasicSetup()

            const sourceModel = { provider: AIProviderName.OPENAI, model: 'gpt-4' }
            const targetModel = { provider: AIProviderName.ANTHROPIC, model: 'claude-3-opus' }

            const flowCount = 150
            const flows = Array.from({ length: flowCount }, () =>
                createMockFlow({ projectId: mockProject.id }),
            )
            await databaseConnection().getRepository('flow').save(flows)

            const versions = flows.map(flow =>
                createMockFlowVersion({
                    flowId: flow.id,
                    state: FlowVersionState.DRAFT,
                    trigger: makeAiTriggerWithStep(sourceModel) as never,
                }),
            )
            await databaseConnection().getRepository('flow_version').save(versions)

            const migrationId = apId()
            await databaseConnection().getRepository('flow_migration').save({
                id: migrationId,
                platformId: mockPlatform.id,
                userId: apId(),
                type: FlowMigrationType.AI_PROVIDER_MODEL,
                status: FlowMigrationStatus.RUNNING,
                migratedVersions: [],
                failedFlowVersions: [],
                params: {
                    sourceModel,
                    targetModel,
                    projectIds: null,
                },
            })

            await flowVersionMigrationService(app!.log).migrateFlowsModelHandler({
                jobId: 'test-job-id',
                migrationId,
                platformId: mockPlatform.id,
                userId: 'test-user-id',
                request: { sourceModel, targetModel },
            })

            for (const flow of flows) {
                const flowVersions = await databaseConnection()
                    .getRepository('flow_version')
                    .find({ where: { flowId: flow.id } })
                expect(flowVersions).toHaveLength(2)

                const draftVersions = flowVersions.filter(v => v.state === FlowVersionState.DRAFT)
                expect(draftVersions).toHaveLength(1)
            }

            const migration = await databaseConnection()
                .getRepository('flow_migration')
                .findOneBy({ id: migrationId })
            expect(migration?.status).toBe(FlowMigrationStatus.COMPLETED)
            expect(migration?.migratedVersions).toHaveLength(flowCount)
        }, 120000)

        it('only migrates matching flows in a mixed batch', async () => {
            const { mockProject, mockPlatform } = await mockAndSaveBasicSetup()

            const sourceModel = { provider: AIProviderName.OPENAI, model: 'gpt-4' }
            const targetModel = { provider: AIProviderName.ANTHROPIC, model: 'claude-3-opus' }
            const differentModel = { provider: AIProviderName.OPENAI, model: 'gpt-3.5-turbo' }

            const matchingFlows = Array.from({ length: 3 }, () =>
                createMockFlow({ projectId: mockProject.id }),
            )
            const nonMatchingFlows = Array.from({ length: 2 }, () =>
                createMockFlow({ projectId: mockProject.id }),
            )
            await databaseConnection().getRepository('flow').save([...matchingFlows, ...nonMatchingFlows])

            const matchingVersions = matchingFlows.map(flow =>
                createMockFlowVersion({
                    flowId: flow.id,
                    state: FlowVersionState.DRAFT,
                    trigger: makeAiTriggerWithStep(sourceModel) as never,
                }),
            )
            const nonMatchingVersions = nonMatchingFlows.map(flow =>
                createMockFlowVersion({
                    flowId: flow.id,
                    state: FlowVersionState.DRAFT,
                    trigger: makeAiTriggerWithStep(differentModel) as never,
                }),
            )
            await databaseConnection().getRepository('flow_version').save([...matchingVersions, ...nonMatchingVersions])

            const migrationId = apId()
            await databaseConnection().getRepository('flow_migration').save({
                id: migrationId,
                platformId: mockPlatform.id,
                userId: apId(),
                type: FlowMigrationType.AI_PROVIDER_MODEL,
                status: FlowMigrationStatus.RUNNING,
                migratedVersions: [],
                failedFlowVersions: [],
                params: {
                    sourceModel,
                    targetModel,
                    projectIds: null,
                },
            })

            await flowVersionMigrationService(app!.log).migrateFlowsModelHandler({
                jobId: 'test-job-id',
                migrationId,
                platformId: mockPlatform.id,
                userId: 'test-user-id',
                request: { sourceModel, targetModel },
            })

            for (const flow of matchingFlows) {
                const flowVersions = await databaseConnection()
                    .getRepository('flow_version')
                    .find({ where: { flowId: flow.id } })
                expect(flowVersions).toHaveLength(2)

                const draftVersions = flowVersions.filter(v => v.state === FlowVersionState.DRAFT)
                expect(draftVersions).toHaveLength(1)
            }

            for (const flow of nonMatchingFlows) {
                const flowVersions = await databaseConnection()
                    .getRepository('flow_version')
                    .find({ where: { flowId: flow.id } })
                expect(flowVersions).toHaveLength(1)
                expect(flowVersions[0].state).toBe(FlowVersionState.DRAFT)
            }
        })

        it('does not touch flows with no AI steps', async () => {
            const { mockProject, mockPlatform } = await mockAndSaveBasicSetup()

            const sourceModel = { provider: AIProviderName.OPENAI, model: 'gpt-4' }
            const targetModel = { provider: AIProviderName.ANTHROPIC, model: 'claude-3-opus' }

            const mockFlow = createMockFlow({ projectId: mockProject.id })
            await databaseConnection().getRepository('flow').save(mockFlow)

            const versionWithNoAi = createMockFlowVersion({
                flowId: mockFlow.id,
                state: FlowVersionState.DRAFT,
            })
            await databaseConnection().getRepository('flow_version').save(versionWithNoAi)

            const migrationId = apId()
            await databaseConnection().getRepository('flow_migration').save({
                id: migrationId,
                platformId: mockPlatform.id,
                userId: apId(),
                type: FlowMigrationType.AI_PROVIDER_MODEL,
                status: FlowMigrationStatus.RUNNING,
                migratedVersions: [],
                failedFlowVersions: [],
                params: {
                    sourceModel,
                    targetModel,
                    projectIds: null,
                },
            })

            await flowVersionMigrationService(app!.log).migrateFlowsModelHandler({
                jobId: 'test-job-id',
                migrationId,
                platformId: mockPlatform.id,
                userId: 'test-user-id',
                request: { sourceModel, targetModel },
            })

            const versions = await databaseConnection()
                .getRepository('flow_version')
                .find({ where: { flowId: mockFlow.id } })
            expect(versions).toHaveLength(1)
            expect(versions[0].state).toBe(FlowVersionState.DRAFT)
            expect(versions[0].id).toBe(versionWithNoAi.id)
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

            const migrationId = apId()
            await databaseConnection().getRepository('flow_migration').save({
                id: migrationId,
                platformId: mockPlatform.id,
                userId: apId(),
                type: FlowMigrationType.AI_PROVIDER_MODEL,
                status: FlowMigrationStatus.RUNNING,
                migratedVersions: [],
                failedFlowVersions: [],
                params: {
                    sourceModel,
                    targetModel,
                    projectIds: null,
                },
            })

            await flowVersionMigrationService(app!.log).migrateFlowsModelHandler({
                jobId: 'test-job-id',
                migrationId,
                platformId: mockPlatform.id,
                userId: 'test-user-id',
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
