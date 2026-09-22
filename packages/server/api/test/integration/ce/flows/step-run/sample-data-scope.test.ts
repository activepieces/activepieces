import { apDayjs } from '@activepieces/server-utils'
import {
    FileCompression,
    FileType,
    FlowAction,
    FlowActionType,
    FlowTrigger,
    FlowTriggerType,
    FlowVersion,
    SampleDataFileType,
} from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { sampleDataService } from '../../../../../src/app/flows/step-run/sample-data.service'
import { db } from '../../../../helpers/db'
import { createMockFile, createMockFlowVersion, mockAndSaveBasicSetup } from '../../../../helpers/mocks'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../../helpers/test-setup'

let app: FastifyInstance
let projectId: string
let flowVersion: FlowVersion

beforeAll(async () => {
    app = await setupTestEnvironment()
    const { mockPlatform, mockProject } = await mockAndSaveBasicSetup()
    projectId = mockProject.id
    flowVersion = await buildFlowVersion({ projectId, platformId: mockPlatform.id })
})

afterAll(async () => {
    await teardownTestEnvironment()
})

async function saveSampleDataFile({ projectId, platformId, output }: SaveSampleDataFileParams): Promise<string> {
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

function pieceStep({ name, sampleDataFileId, nextAction }: PieceStepParams): FlowAction {
    return {
        type: FlowActionType.PIECE,
        name,
        displayName: name,
        settings: {
            pieceName: '@activepieces/piece-webhook',
            pieceVersion: '~0.1.29',
            actionName: 'return_response',
            input: {},
            propertySettings: {},
            errorHandlingOptions: {},
            sampleData: { sampleDataFileId, lastTestDate: apDayjs().toISOString() },
        },
        valid: true,
        lastUpdatedDate: apDayjs().toISOString(),
        nextAction,
    }
}

async function buildFlowVersion({ projectId, platformId }: BuildFlowVersionParams): Promise<FlowVersion> {
    const [triggerFileId, firstFileId, secondFileId, unrelatedFileId] = await Promise.all([
        saveSampleDataFile({ projectId, platformId, output: { rows: [1, 2] } }),
        saveSampleDataFile({ projectId, platformId, output: { body: 'step_1' } }),
        saveSampleDataFile({ projectId, platformId, output: { body: 'step_2' } }),
        saveSampleDataFile({ projectId, platformId, output: { body: 'unrelated' } }),
    ])

    const loopStep: FlowAction = {
        type: FlowActionType.LOOP_ON_ITEMS,
        name: 'loop_1',
        displayName: 'loop_1',
        settings: { items: '{{trigger.rows}}' },
        valid: true,
        lastUpdatedDate: apDayjs().toISOString(),
        nextAction: pieceStep({ name: 'unrelated', sampleDataFileId: unrelatedFileId }),
    }

    const trigger: FlowTrigger = {
        type: FlowTriggerType.PIECE,
        name: 'trigger',
        displayName: 'trigger',
        settings: {
            pieceName: '@activepieces/piece-webhook',
            pieceVersion: '~0.1.29',
            triggerName: 'catch_webhook',
            input: {},
            propertySettings: {},
            sampleData: { sampleDataFileId: triggerFileId, lastTestDate: apDayjs().toISOString() },
        },
        valid: true,
        lastUpdatedDate: apDayjs().toISOString(),
        nextAction: pieceStep({
            name: 'step_1',
            sampleDataFileId: firstFileId,
            nextAction: pieceStep({
                name: 'step_2',
                sampleDataFileId: secondFileId,
                nextAction: loopStep,
            }),
        }),
    }

    return createMockFlowVersion({ trigger })
}

describe('Sample data scope for property resolution', () => {
    it.each([
        ['an input that references no step', { authType: 'basic' }, []],
        ['only the step the input references', { url: '{{step_2.body}}' }, ['step_2']],
        ['a referenced loop and the step it iterates over', { url: '{{loop_1.item}}' }, ['loop_1', 'trigger']],
    ])('reads %s', async (_case, referencedBy, expectedStepNames) => {
        const sampleData = await sampleDataService(app.log).getSampleDataForFlow({
            projectId,
            flowVersion,
            type: SampleDataFileType.OUTPUT,
            referencedBy,
        })

        expect(Object.keys(sampleData).sort()).toStrictEqual(expectedStepNames)
    })

    it('still reads every step for a whole-flow read', async () => {
        const sampleData = await sampleDataService(app.log).getSampleDataForFlow({
            projectId,
            flowVersion,
            type: SampleDataFileType.OUTPUT,
        })

        expect(Object.keys(sampleData).sort()).toStrictEqual(['loop_1', 'step_1', 'step_2', 'trigger', 'unrelated'])
    })
})

type SaveSampleDataFileParams = {
    projectId: string
    platformId: string
    output: unknown
}

type PieceStepParams = {
    name: string
    sampleDataFileId: string
    nextAction?: FlowAction
}

type BuildFlowVersionParams = {
    projectId: string
    platformId: string
}
