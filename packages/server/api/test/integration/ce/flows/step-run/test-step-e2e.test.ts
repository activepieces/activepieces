import { apDayjs } from '@activepieces/server-utils'
import {
    FileCompression,
    FileType,
    FlowActionType,
    FlowRunStatus,
    FlowTriggerType,
    FlowVersionState,
    PackageType,
    PieceType,
} from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { worker } from '../../../../../../worker/src/lib/worker'
import { databaseConnection } from '../../../../../src/app/database/database-connection'
import { flowRunService } from '../../../../../src/app/flows/flow-run/flow-run-service'
import { db } from '../../../../helpers/db'
import { setupE2eEnvironment } from '../../../../helpers/e2e-setup'
import {
    createMockFile,
    createMockFlow,
    createMockFlowVersion,
    createMockPieceMetadata,
    mockAndSaveBasicSetup,
} from '../../../../helpers/mocks'

let app: FastifyInstance

beforeAll(async () => {
    const ctx = await setupE2eEnvironment()
    app = ctx.app
    await worker.start({
        apiUrl: ctx.apiUrl,
        socketUrl: { url: ctx.apiUrl, path: '/api/socket.io' },
        workerToken: ctx.workerToken,
    })
    await new Promise((resolve) => setTimeout(resolve, 5000))
}, 30_000)

afterAll(async () => {
    worker.stop()
    await app.close()
}, 15_000)

async function saveSampleDataFile({ projectId, platformId, output }: { projectId: string, platformId: string, output: unknown }): Promise<string> {
    const file = createMockFile({
        projectId,
        platformId,
        type: FileType.SAMPLE_DATA,
        compression: FileCompression.NONE,
        data: Buffer.from(JSON.stringify(output)),
    })
    await db.save('file', file)
    return file.id
}

async function pollFlowRunToCompletion({ flowRunId, projectId }: { flowRunId: string, projectId: string }) {
    const deadline = Date.now() + 120_000
    let result = await flowRunService(app.log).getOnePopulatedOrThrow({ id: flowRunId, projectId })
    while (
        (result.status === FlowRunStatus.QUEUED || result.status === FlowRunStatus.RUNNING) &&
        Date.now() < deadline
    ) {
        await new Promise((resolve) => setTimeout(resolve, 500))
        result = await flowRunService(app.log).getOnePopulatedOrThrow({ id: flowRunId, projectId })
    }
    return result
}

describe('Test step with narrowed sample data', () => {
    it('resolves a reference to an earlier step through the full worker round trip', async () => {
        const { mockPlatform, mockProject } = await mockAndSaveBasicSetup()

        const triggerFileId = await saveSampleDataFile({
            projectId: mockProject.id,
            platformId: mockPlatform.id,
            output: { unreferenced: 'trigger payload the tested step never mentions' },
        })
        const firstStepFileId = await saveSampleDataFile({
            projectId: mockProject.id,
            platformId: mockPlatform.id,
            output: { value: 'from-step-1' },
        })

        const mockPiece = createMockPieceMetadata({
            name: '@activepieces/piece-webhook',
            version: '0.1.29',
            platformId: undefined,
            packageType: PackageType.REGISTRY,
            pieceType: PieceType.OFFICIAL,
        })
        await databaseConnection().getRepository('piece_metadata').save(mockPiece)

        const mockFlow = createMockFlow({ projectId: mockProject.id })
        await db.save('flow', mockFlow)

        const stepUnderTest = {
            type: FlowActionType.CODE,
            name: 'step_2',
            displayName: 'Echo',
            valid: true,
            lastUpdatedDate: apDayjs().toISOString(),
            settings: {
                sourceCode: {
                    code: 'export const code = async (inputs) => ({ echoed: inputs.value });',
                    packageJson: '{}',
                },
                input: { value: '{{step_1[\'output\'].value}}' },
                errorHandlingOptions: {},
            },
        }

        const mockFlowVersion = createMockFlowVersion({
            flowId: mockFlow.id,
            state: FlowVersionState.DRAFT,
            trigger: {
                type: FlowTriggerType.PIECE,
                name: 'trigger',
                displayName: 'Catch Webhook',
                valid: true,
                lastUpdatedDate: apDayjs().toISOString(),
                settings: {
                    pieceName: '@activepieces/piece-webhook',
                    pieceVersion: '~0.1.29',
                    triggerName: 'catch_webhook',
                    input: {},
                    propertySettings: {},
                    sampleData: { sampleDataFileId: triggerFileId, lastTestDate: apDayjs().toISOString() },
                },
                nextAction: {
                    type: FlowActionType.CODE,
                    name: 'step_1',
                    displayName: 'Produce Value',
                    valid: true,
                    lastUpdatedDate: apDayjs().toISOString(),
                    settings: {
                        sourceCode: { code: 'export const code = async () => ({ value: \'never runs\' });', packageJson: '{}' },
                        input: {},
                        errorHandlingOptions: {},
                        sampleData: { sampleDataFileId: firstStepFileId, lastTestDate: apDayjs().toISOString() },
                    },
                    nextAction: stepUnderTest,
                },
            },
        })
        await db.save('flow_version', mockFlowVersion)

        const flowRun = await flowRunService(app.log).test({
            projectId: mockProject.id,
            flowVersionId: mockFlowVersion.id,
            stepNameToTest: 'step_2',
            triggeredBy: undefined,
        })

        const result = await pollFlowRunToCompletion({ flowRunId: flowRun.id, projectId: mockProject.id })

        expect(result.status).toBe(FlowRunStatus.SUCCEEDED)
        expect(result.steps?.['step_2']?.output).toStrictEqual({ echoed: 'from-step-1' })
    }, 180_000)
})
