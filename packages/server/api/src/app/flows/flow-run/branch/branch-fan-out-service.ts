import { apId, isNil } from '@activepieces/core-utils'
import { ActivepiecesError, ErrorCode, ExecutionType, FanOutBranchesResponse, FileCompression, FileType, FlowRun, FlowRunStatus, PauseType, ResumeReason, StreamStepProgress, WaitpointVersion } from '@activepieces/shared'
import dayjs from 'dayjs'
import { FastifyBaseLogger } from 'fastify'
import { In, IsNull, LessThan, Not } from 'typeorm'
import { repoFactory } from '../../../core/db/repo-factory'
import { fileService } from '../../../file/file.service'
import { system } from '../../../helper/system/system'
import { AppSystemProp } from '../../../helper/system/system-props'
import { projectService } from '../../../project/project-service'
import { FlowRunEntity } from '../flow-run-entity'
import { addToQueue, findFlowRunOrThrow } from '../flow-run-service'
import { runsMetadataQueue } from '../flow-runs-queue'
import { resumeService } from '../waitpoint/resume-service'
import { waitpointService } from '../waitpoint/waitpoint-service'

const flowRunRepo = repoFactory(FlowRunEntity)

// A branch is only swept once it is well past the point a healthy run could still be alive.
const STUCK_BRANCH_GRACE_FACTOR = 3
const STUCK_BRANCH_SWEEP_LIMIT = 500

export const branchFanOutService = (log: FastifyBaseLogger) => ({
    async fanOut({ flowRunId, stepName, itemCount }: FanOutParams): Promise<FanOutBranchesResponse> {
        const parentRun = await findFlowRunOrThrow(flowRunId)
        if (isNil(parentRun.logsFileId)) {
            throw new ActivepiecesError({
                code: ErrorCode.VALIDATION,
                params: { message: 'Parent run has no logs file to seed branches from' },
            })
        }
        const platformId = await projectService(log).getPlatformId(parentRun.projectId)
        const { waitpoint } = await waitpointService(log).createForPause({
            flowRunId,
            projectId: parentRun.projectId,
            stepName,
            type: PauseType.WEBHOOK,
            version: WaitpointVersion.enum.V1,
        })

        const parentLog = await fileService(log).getDataOrThrow({
            projectId: parentRun.projectId,
            fileId: parentRun.logsFileId,
            type: FileType.FLOW_RUN_LOG,
        })

        for (let index = 0; index < itemCount; ++index) {
            await startBranch({
                parentRun,
                platformId,
                waitpointId: waitpoint.id,
                stepName,
                index,
                seedLog: parentLog.data,
            }, log)
        }

        return { waitpointId: waitpoint.id, branchCount: itemCount }
    },

    // A branch that dies without ever reaching a terminal state (worker OOM) would hold its
    // parent's barrier open forever, so failing it here is what releases the parent.
    async failStuckBranches(): Promise<void> {
        const deadline = dayjs().subtract(system.getNumberOrThrow(AppSystemProp.FLOW_TIMEOUT_SECONDS) * STUCK_BRANCH_GRACE_FACTOR, 'seconds').toISOString()
        const stuck = await flowRunRepo().find({
            where: {
                parentWaitpointId: Not(IsNull()),
                status: In([FlowRunStatus.RUNNING, FlowRunStatus.QUEUED]),
                updated: LessThan(deadline),
            },
            select: ['id', 'parentRunId', 'parentWaitpointId'],
            take: STUCK_BRANCH_SWEEP_LIMIT,
        })
        for (const branch of stuck) {
            log.warn({ flowRun: { id: branch.id } }, '[branchFanOutService#failStuckBranches] Branch run exceeded the flow timeout without finishing, failing it to release its parent')
            await flowRunRepo().update({ id: branch.id }, {
                status: FlowRunStatus.TIMEOUT,
                finishTime: dayjs().toISOString(),
                updated: dayjs().toISOString(),
            })
            if (!isNil(branch.parentRunId) && !isNil(branch.parentWaitpointId)) {
                await resumeService(log).resumeFromWaitpoint({
                    flowRunId: branch.parentRunId,
                    waitpointId: branch.parentWaitpointId,
                    resumePayload: null,
                })
            }
        }
    },
})

async function startBranch({ parentRun, platformId, waitpointId, stepName, index, seedLog }: StartBranchParams, log: FastifyBaseLogger): Promise<void> {
    const logsFile = await fileService(log).save({
        projectId: parentRun.projectId,
        platformId,
        type: FileType.FLOW_RUN_LOG,
        fileName: `${parentRun.id}-branch-${index}.log`,
        compression: FileCompression.NONE,
        data: seedLog,
    })
    const now = dayjs().toISOString()
    const branchRun: FlowRun = {
        id: apId(),
        projectId: parentRun.projectId,
        flowId: parentRun.flowId,
        flowVersionId: parentRun.flowVersionId,
        environment: parentRun.environment,
        parentRunId: parentRun.id,
        parentWaitpointId: waitpointId,
        branch: { stepName, index },
        failParentOnFailure: false,
        status: FlowRunStatus.QUEUED,
        logsFileId: logsFile.id,
        created: now,
        updated: now,
        tags: [],
        steps: {},
    }
    await runsMetadataQueue(log).add(branchRun)
    await addToQueue({
        flowRun: branchRun,
        platformId,
        payload: null,
        executionType: ExecutionType.RESUME,
        resumeReason: ResumeReason.WAITPOINT,
        streamStepProgress: StreamStepProgress.NONE,
        workerHandlerId: undefined,
        httpRequestId: undefined,
        jobId: `${parentRun.id}-branch-${index}`,
    }, log)
}

type FanOutParams = {
    flowRunId: string
    stepName: string
    itemCount: number
}

type StartBranchParams = {
    parentRun: FlowRun
    platformId: string
    waitpointId: string
    stepName: string
    index: number
    seedLog: Buffer
}
