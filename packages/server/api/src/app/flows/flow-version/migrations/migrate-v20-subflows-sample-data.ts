import {
    DATA_TYPE_KEY_IN_FILE_METADATA,
    FileCompression,
    FileType,
    FlowActionType,
    flowStructureUtil,
    FlowTriggerType,
    FlowVersion,
    isNil,
    ProjectId,
    SampleDataDataType,
    Step,
} from '@activepieces/shared'
import dayjs from 'dayjs'
import pino from 'pino'
import { fileService } from '../../../file/file.service'
import { flowRepo } from '../../flow/flow.repo'
import { Migration, MigrationContext } from '.'

const SUBFLOWS_PIECE = '@activepieces/piece-subflows'
const SUBFLOWS_PIECE_VERSION = '0.5.0'

export const migrateV20SubflowsSampleData: Migration = {
    targetSchemaVersion: '20',
    migrate: async (flowVersion: FlowVersion, context?: MigrationContext): Promise<FlowVersion> => {
        const triggerNeedsFile = needsTriggerFileBackfill(flowVersion)
        const projectId = triggerNeedsFile
            ? await resolveProjectId({ flowVersion, context })
            : undefined

        const triggerFileId = triggerNeedsFile && !isNil(projectId)
            ? await createTriggerSampleDataFile({
                flowVersion,
                projectId,
                context,
            })
            : undefined

        const newVersion = flowStructureUtil.transferFlow(flowVersion, (step: Step) => {
            if (!isSubflowsStep(step)) {
                return step
            }
            if (step.type === FlowTriggerType.PIECE && getTriggerName(step) === 'callableFlow') {
                return migrateCallableFlowTrigger(step, triggerFileId)
            }
            if (step.type === FlowActionType.PIECE && step.settings.actionName === 'callFlow') {
                return migrateCallFlowAction(step)
            }
            // any other subflows action (returnResponse) — only bump piece version
            return {
                ...step,
                settings: {
                    ...step.settings,
                    pieceVersion: SUBFLOWS_PIECE_VERSION,
                },
            }
        })

        return {
            ...newVersion,
            schemaVersion: '21',
        }
    },
}

function isSubflowsStep(step: Step): boolean {
    if (step.type !== FlowTriggerType.PIECE && step.type !== FlowActionType.PIECE) {
        return false
    }
    return step.settings.pieceName === SUBFLOWS_PIECE
}

function getTriggerName(step: Step): string | undefined {
    const settings = step.settings as { triggerName?: string }
    return settings.triggerName
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
    return !isNil(value) && typeof value === 'object' && !Array.isArray(value)
}

function getLegacySample(step: Step): Record<string, unknown> | undefined {
    const input = step.settings.input as Record<string, unknown> | undefined
    const exampleData = input?.exampleData as { sampleData?: unknown } | undefined
    if (!isPlainObject(exampleData?.sampleData)) {
        return undefined
    }
    return exampleData.sampleData
}

function needsTriggerFileBackfill(flowVersion: FlowVersion): boolean {
    return flowStructureUtil.getAllSteps(flowVersion.trigger).some((step) => {
        if (step.type !== FlowTriggerType.PIECE) return false
        if (!isSubflowsStep(step)) return false
        if (getTriggerName(step) !== 'callableFlow') return false
        const sampleData = step.settings.sampleData as { sampleDataFileId?: string } | undefined
        if (!isNil(sampleData?.sampleDataFileId)) return false
        return !isNil(getLegacySample(step))
    })
}

async function resolveProjectId({
    flowVersion,
    context,
}: {
    flowVersion: FlowVersion
    context?: MigrationContext
}): Promise<ProjectId | undefined> {
    if (!isNil(context?.projectId)) {
        return context.projectId
    }
    if (isNil(flowVersion.flowId) || flowVersion.flowId === '') {
        return undefined
    }
    const flow = await flowRepo().findOne({ where: { id: flowVersion.flowId }, select: ['projectId'] })
    return flow?.projectId
}

async function createTriggerSampleDataFile({
    flowVersion,
    projectId,
    context,
}: {
    flowVersion: FlowVersion
    projectId: string
    context?: MigrationContext
}): Promise<string | undefined> {
    const trigger = flowVersion.trigger
    if (trigger.type !== FlowTriggerType.PIECE) return undefined
    if (trigger.settings.pieceName !== SUBFLOWS_PIECE) return undefined
    if (getTriggerName(trigger) !== 'callableFlow') return undefined
    const legacy = getLegacySample(trigger)
    if (isNil(legacy)) return undefined

    const data = Buffer.from(JSON.stringify(legacy))
    const file = await fileService(context?.log ?? pino({ level: 'silent' })).save({
        projectId,
        data,
        size: data.length,
        type: FileType.SAMPLE_DATA,
        compression: FileCompression.NONE,
        metadata: {
            flowId: flowVersion.flowId,
            flowVersionId: flowVersion.id,
            stepName: trigger.name,
            [DATA_TYPE_KEY_IN_FILE_METADATA]: SampleDataDataType.JSON,
        },
    })
    return file.id
}

function migrateCallableFlowTrigger(step: Step, fileId: string | undefined): Step {
    const existingSampleData = step.settings.sampleData as { sampleDataFileId?: string, sampleDataInputFileId?: string, lastTestDate?: string } | undefined
    const newSampleData = !isNil(existingSampleData?.sampleDataFileId)
        ? existingSampleData
        : !isNil(fileId)
            ? {
                sampleDataFileId: fileId,
                sampleDataInputFileId: existingSampleData?.sampleDataInputFileId,
                lastTestDate: dayjs().toISOString(),
            }
            : existingSampleData
    const input = step.settings.input as Record<string, unknown> | undefined
    const cleanedInput: Record<string, unknown> = {}
    if (input) {
        for (const [key, value] of Object.entries(input)) {
            if (key === 'mode' || key === 'exampleData') continue
            cleanedInput[key] = value
        }
    }
    return {
        ...step,
        settings: {
            ...step.settings,
            pieceVersion: SUBFLOWS_PIECE_VERSION,
            input: cleanedInput,
            sampleData: newSampleData,
        },
    }
}

function migrateCallFlowAction(step: Step): Step {
    const input = step.settings.input as Record<string, unknown> | undefined
    if (isNil(input)) {
        return {
            ...step,
            settings: {
                ...step.settings,
                pieceVersion: SUBFLOWS_PIECE_VERSION,
            },
        }
    }
    const flow = input.flow as { externalId?: string } | undefined
    const flowKeys = isNil(flow) ? [] : Object.keys(flow)
    const flowAlreadyTrimmed = flowKeys.length === 1 && flowKeys[0] === 'externalId'
    return {
        ...step,
        settings: {
            ...step.settings,
            pieceVersion: SUBFLOWS_PIECE_VERSION,
            input: flowAlreadyTrimmed || isNil(flow)
                ? input
                : {
                    ...input,
                    flow: { externalId: flow.externalId },
                },
        },
    }
}
