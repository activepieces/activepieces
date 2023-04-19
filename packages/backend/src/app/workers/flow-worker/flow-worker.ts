import fs from 'fs-extra'
import {
    ActionType,
    ActivepiecesError,
    apId,
    CodeActionSettings,
    ErrorCode,
    ExecutionOutputStatus,
    File,
    flowHelper,
    FlowVersion,
    FlowVersionState,
    ProjectId,
    StepOutputStatus,
    TriggerType,
} from '@activepieces/shared'
import { Sandbox, sandboxManager } from '../sandbox'
import { flowVersionService } from '../../flows/flow-version/flow-version.service'
import { fileService } from '../../file/file.service'
import { codeBuilder } from '../code-worker/code-builder'
import { flowRunService } from '../../flows/flow-run/flow-run-service'
import { OneTimeJobData } from './job-data'
import { collectionService } from '../../collections/collection.service'
import { engineHelper } from '../../helper/engine-helper'
import { acquireLock } from '../../database/redis-connection'
import { captureException, logger } from '../../helper/logger'
import { pieceManager } from '../../flows/common/piece-installer'
import { isNil } from 'lodash'

type FlowPiece = {
    name: string
    version: string
}

type InstallPiecesParams = {
    path: string
    flowVersion: FlowVersion
}

const log = logger.child({ file: 'FlowWorker' })

const extractFlowPieces = (flowVersion: FlowVersion): FlowPiece[] => {
    const pieces: FlowPiece[] = []
    const steps = flowHelper.getAllSteps(flowVersion)

    for (const step of steps) {
        if (step.type === TriggerType.PIECE || step.type === ActionType.PIECE) {
            const { pieceName, pieceVersion } = step.settings
            pieces.push({
                name: pieceName,
                version: pieceVersion,
            })
        }
    }

    return pieces
}

const installPieces = async (params: InstallPiecesParams): Promise<void> => {
    const { path, flowVersion } = params
    const pieces = extractFlowPieces(flowVersion)

    await pieceManager.install({
        projectPath: path,
        pieces,
    })
}

async function executeFlow(jobData: OneTimeJobData): Promise<void> {
    const flowVersion = await flowVersionService.getOneOrThrow(jobData.flowVersionId)
    const collection = await collectionService.getOneOrThrow({ projectId: jobData.projectId, id: jobData.collectionId })

    // Don't use sandbox for draft versions, since they are mutable and we don't want to cache them.
    const key = flowVersion.id + (FlowVersionState.DRAFT === flowVersion.state ? '-draft' + apId() : '')
    const sandbox = await sandboxManager.obtainSandbox(key)
    const startTime = Date.now()
    logger.info(`[${jobData.runId}] Executing flow ${flowVersion.id} in sandbox ${sandbox.boxId}`)
    try {
        if (!sandbox.cached) {
            await sandbox.recreate()
            await downloadFiles(sandbox, jobData.projectId, flowVersion)

            const path = sandbox.getSandboxFolderPath()

            await installPieces({
                path,
                flowVersion,
            })

            logger.info(`[${jobData.runId}] Preparing sandbox ${sandbox.boxId} took ${Date.now() - startTime}ms`)
        }
        else {
            await sandbox.clean()
            logger.info(`[${jobData.runId}] Reusing sandbox ${sandbox.boxId} took ${Date.now() - startTime}ms`)
        }
        const executionOutput = await engineHelper.executeFlow(sandbox, {
            flowVersionId: flowVersion.id,
            collectionId: collection.id,
            projectId: collection.projectId,
            triggerPayload: {
                duration: 0,
                input: {},
                output: jobData.payload,
                status: StepOutputStatus.SUCCEEDED,
            },
        })
        const logsFile = await fileService.save(jobData.projectId, Buffer.from(JSON.stringify(executionOutput)))
        await flowRunService.finish(jobData.runId, executionOutput.status, logsFile.id, executionOutput.tasks)
    }
    catch (e: unknown) {
        log.error(e, `[${jobData.runId}] Error executing flow`)
        if (await sandbox.timedOut()) {
            // TODO Flow timed out, consume one task
            await flowRunService.finish(jobData.runId, ExecutionOutputStatus.TIMEOUT, null)
        }
        else {
            captureException(e as Error)
            await flowRunService.finish(jobData.runId, ExecutionOutputStatus.INTERNAL_ERROR, null, 0)
        }
    }
    finally {
        await sandboxManager.returnSandbox(sandbox.boxId)
    }
    log.info(`[${jobData.runId}] Finished executing flow ${flowVersion.id} in sandbox ${sandbox.boxId} in ${Date.now() - startTime}ms`)
}

async function downloadFiles(
    sandbox: Sandbox,
    projectId: ProjectId,
    flowVersion: FlowVersion,
): Promise<void> {
    log.info(`[${flowVersion.id}] Acquiring flow lock to build codes`)
    const flowLock = await acquireLock({
        key: flowVersion.id,
        timeout: 60000,
    })
    try {
        const buildPath = sandbox.getSandboxFolderPath()

        // This has to be before flows, since it does modify code settings and fill it with packaged file id.
        await fs.ensureDir(`${buildPath}/codes/`)
        const artifacts: File[] = await buildCodes(projectId, flowVersion)

        for (const artifact of artifacts) {
            await fs.writeFile(`${buildPath}/codes/${artifact.id}.js`, artifact.data)
        }

        await fs.ensureDir(`${buildPath}/flows/`)
        await fs.writeFile(`${buildPath}/flows/${flowVersion.id}.json`, JSON.stringify(flowVersion))

    }
    finally {
        log.info(`[${flowVersion.id}] Releasing flow lock`)
        await flowLock.release()
    }

}


async function buildCodes(projectId: ProjectId, flowVersion: FlowVersion): Promise<File[]> {
    const buildRequests: Array<Promise<File>> = []
    const steps = flowHelper.getAllSteps(flowVersion)
    steps.forEach((step) => {
        if (step.type === ActionType.CODE) {
            const codeActionSettings: CodeActionSettings = step.settings
            buildRequests.push(getArtifactFile(projectId, codeActionSettings))
        }
    })
    const files: File[] = await Promise.all(buildRequests)
    if (files.length > 0) {
        await flowVersionService.overwriteVersion(flowVersion.id, flowVersion)
    }
    return files
}

const getArtifactFile = async (projectId: ProjectId, codeActionSettings: CodeActionSettings): Promise<File> => {
    if (codeActionSettings.artifactPackagedId === undefined) {
        log.info(`Building package for file id ${codeActionSettings.artifactSourceId}`)

        const sourceId = codeActionSettings.artifactSourceId

        if (isNil(sourceId)) {
            throw new ActivepiecesError({
                code: ErrorCode.VALIDATION,
                params: {
                    message: 'artifactSourceId is undefined',
                },
            })
        }

        const fileEntity = await fileService.getOneOrThrow({ projectId: projectId, fileId: sourceId })
        const builtFile = await codeBuilder.build(fileEntity.data)
        const savedPackagedFile = await fileService.save(projectId, builtFile)
        codeActionSettings.artifactPackagedId = savedPackagedFile.id
    }

    const file = await fileService.getOneOrThrow({
        projectId: projectId,
        fileId: codeActionSettings.artifactPackagedId,
    })

    return file
}

export const flowWorker = {
    executeFlow,
}
