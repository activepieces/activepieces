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
        it('migrates flows with the matching source model and publishes a new locked version', async () => {
            const { mockProject, mockOwner, mockPlatform } = await mockAndSaveBasicSetup()
            const mockToken = await generateMockToken({
                type: PrincipalType.USER,
                id: mockOwner.id,
                platform: { id: mockPlatform.id },
            })

            const sourceModel = { provider: AIProviderName.OPENAI, model: 'gpt-4' }
            const targetModel = { provider: AIProviderName.ANTHROPIC, model: 'claude-3-opus' }

            const mockFlow = createMockFlow({ projectId: mockProject.id })
            await databaseConnection().getRepository('flow').save(mockFlow)

            const mockFlowVersion = createMockFlowVersion({
                flowId: mockFlow.id,
                state: FlowVersionState.DRAFT,
                trigger: makeAiTriggerWithStep(sourceModel) as never,
            })
            await databaseConnection().getRepository('flow_version').save(mockFlowVersion)

            const response = await app?.inject({
                method: 'POST',
                url: '/v1/flows/versions/migrate-ai-model',
                headers: { authorization: `Bearer ${mockToken}` },
                body: { sourceModel, targetModel },
            })

            expect(response?.statusCode).toBe(StatusCodes.OK)
            expect(response?.json()).toEqual({ updatedFlows: 1 })

            // A new locked version should exist
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

            // step_2 uses input.provider / input.model directly
            const step2 = allSteps.find(s => s.name === 'step_2')
            const step2Input = step2?.settings.input as Record<string, unknown>
            expect(step2Input.provider).toBe(targetModel.provider)
            expect(step2Input.model).toBe(targetModel.model)

            // Flow publishedVersionId should point to the new version
            const updatedFlow = await databaseConnection()
                .getRepository('flow')
                .findOneBy({ id: mockFlow.id })
            expect(updatedFlow?.publishedVersionId).toBe(newVersion.id)
        })

        it('does not migrate flows whose model does not match the source', async () => {
            const { mockProject, mockOwner, mockPlatform } = await mockAndSaveBasicSetup()
            const mockToken = await generateMockToken({
                type: PrincipalType.USER,
                id: mockOwner.id,
                platform: { id: mockPlatform.id },
            })

            const mockFlow = createMockFlow({ projectId: mockProject.id })
            await databaseConnection().getRepository('flow').save(mockFlow)

            const mockFlowVersion = createMockFlowVersion({
                flowId: mockFlow.id,
                state: FlowVersionState.DRAFT,
                trigger: makeAiTriggerWithStep({ provider: AIProviderName.OPENAI, model: 'gpt-3.5-turbo' }) as never,
            })
            await databaseConnection().getRepository('flow_version').save(mockFlowVersion)

            const response = await app?.inject({
                method: 'POST',
                url: '/v1/flows/versions/migrate-ai-model',
                headers: { authorization: `Bearer ${mockToken}` },
                body: {
                    sourceModel: { provider: AIProviderName.OPENAI, model: 'gpt-4' },
                    targetModel: { provider: AIProviderName.ANTHROPIC, model: 'claude-3-opus' },
                },
            })

            expect(response?.statusCode).toBe(StatusCodes.OK)
            expect(response?.json()).toEqual({ updatedFlows: 0 })

            const versions = await databaseConnection()
                .getRepository('flow_version')
                .find({ where: { flowId: mockFlow.id } })
            expect(versions).toHaveLength(1)
        })

        it('only migrates flows within the specified project when projectId is provided', async () => {
            const { mockOwner, mockPlatform, mockProject: projectA } = await mockAndSaveBasicSetup()
            const mockToken = await generateMockToken({
                type: PrincipalType.USER,
                id: mockOwner.id,
                platform: { id: mockPlatform.id },
            })

            // Second project on the same platform
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

            const response = await app?.inject({
                method: 'POST',
                url: '/v1/flows/versions/migrate-ai-model',
                headers: { authorization: `Bearer ${mockToken}` },
                body: { projectIds: [projectA.id], sourceModel, targetModel },
            })

            expect(response?.statusCode).toBe(StatusCodes.OK)
            expect(response?.json()).toEqual({ updatedFlows: 1 })

            // flowA should be migrated
            const flowAVersions = await databaseConnection().getRepository('flow_version').find({ where: { flowId: flowA.id } })
            expect(flowAVersions).toHaveLength(2)

            // flowB should be untouched
            const flowBVersions = await databaseConnection().getRepository('flow_version').find({ where: { flowId: flowB.id } })
            expect(flowBVersions).toHaveLength(1)
        })

        it('does not migrate flows from other platforms', async () => {
            const { mockOwner: ownerA, mockPlatform: platformA } = await mockAndSaveBasicSetup()
            const { mockProject: projectB, mockOwner: ownerB, mockPlatform: platformB } = await mockAndSaveBasicSetup()

            const tokenA = await generateMockToken({
                type: PrincipalType.USER,
                id: ownerA.id,
                platform: { id: platformA.id },
            })

            const sourceModel = { provider: AIProviderName.OPENAI, model: 'gpt-4' }
            const targetModel = { provider: AIProviderName.ANTHROPIC, model: 'claude-3-opus' }

            // Flow belongs to platformB
            const flowB = createMockFlow({ projectId: projectB.id })
            await databaseConnection().getRepository('flow').save(flowB)
            await databaseConnection().getRepository('flow_version').save(
                createMockFlowVersion({ flowId: flowB.id, state: FlowVersionState.DRAFT, trigger: makeAiTriggerWithStep(sourceModel) as never }),
            )

            // Request as platformA — should not touch platformB's flows
            const response = await app?.inject({
                method: 'POST',
                url: '/v1/flows/versions/migrate-ai-model',
                headers: { authorization: `Bearer ${tokenA}` },
                body: { sourceModel, targetModel },
            })

            expect(response?.statusCode).toBe(StatusCodes.OK)
            expect(response?.json()).toEqual({ updatedFlows: 0 })

            const versions = await databaseConnection().getRepository('flow_version').find({ where: { flowId: flowB.id } })
            expect(versions).toHaveLength(1)

            // Suppress unused variable warnings
            void ownerB
            void platformB
        })

    })
})
