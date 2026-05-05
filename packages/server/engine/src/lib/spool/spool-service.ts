import fs from 'fs/promises'
import path from 'path'
import {
    apId,
    BaseStepOutput,
    buildDehydratedRef,
    DehydratedRef,
    EngineGenericError,
    FlowActionType,
    GenericStepOutput,
    isDehydratedRef,
    StepOutput,
} from '@activepieces/shared'
import { utils } from '../utils'

const DEFAULT_THRESHOLD_KB = 64
const SPOOL_THRESHOLD_BYTES = Number(
    process.env.AP_FLOW_RUN_LOG_SPOOL_THRESHOLD_KB ?? DEFAULT_THRESHOLD_KB,
) * 1024

const SPOOL_BASE_DIR = process.env.AP_FLOW_RUN_LOG_SPOOL_DIR ?? '/tmp/ap-runs'

const inFlightDirCreates = new Map<string, Promise<void>>()

export const spoolService = {
    threshold(): number {
        return SPOOL_THRESHOLD_BYTES
    },
    baseDir(): string {
        return SPOOL_BASE_DIR
    },
    runDir(runId: string): string {
        return path.join(SPOOL_BASE_DIR, runId)
    },
    async maybeSpool({ value, ctx }: MaybeSpoolParams): Promise<MaybeSpoolResult> {
        if (isDehydratedRef(value)) {
            return { value, dehydrated: false }
        }
        const size = utils.sizeof(value)
        if (size <= SPOOL_THRESHOLD_BYTES) {
            return { value, dehydrated: false }
        }
        const fileId = apId()
        const serialized = Buffer.from(JSON.stringify(value), 'utf-8')
        await ensureRunDir(ctx.runId)
        const localPath = blobLocalPath({ runId: ctx.runId, fileId })
        await fs.writeFile(localPath, serialized)
        await uploadBlob({ ctx, fileId, data: serialized })
        const ref = buildDehydratedRef({ fileId, size })
        return { value: ref, dehydrated: true }
    },
    async hydrate({ ref, ctx }: HydrateParams): Promise<unknown> {
        const localPath = blobLocalPath({ runId: ctx.runId, fileId: ref.fileId })
        const fromLocal = await readLocalIfExists(localPath)
        if (fromLocal !== undefined) {
            return JSON.parse(fromLocal.toString('utf-8'))
        }
        const downloaded = await downloadBlob({ ctx, fileId: ref.fileId })
        await ensureRunDir(ctx.runId)
        await fs.writeFile(localPath, downloaded).catch(() => undefined)
        return JSON.parse(downloaded.toString('utf-8'))
    },
    async cleanupRun(runId: string): Promise<void> {
        const dir = path.join(SPOOL_BASE_DIR, runId)
        await fs.rm(dir, { recursive: true, force: true }).catch(() => undefined)
    },
    async maybeSpoolStepOutput({ stepOutput, ctx }: { stepOutput: BaseStepOutput, ctx: SpoolContext }): Promise<BaseStepOutput> {
        if (stepOutput.type === FlowActionType.LOOP_ON_ITEMS) {
            return stepOutput
        }
        if (stepOutput.output === undefined || stepOutput.output === null) {
            return stepOutput
        }
        if (isDehydratedRef(stepOutput.output)) {
            return stepOutput
        }
        const result = await spoolService.maybeSpool({ value: stepOutput.output, ctx })
        if (!result.dehydrated) {
            return stepOutput
        }
        return new GenericStepOutput({
            type: stepOutput.type,
            status: stepOutput.status,
            input: stepOutput.input,
            output: result.value,
            duration: stepOutput.duration,
            errorMessage: stepOutput.errorMessage,
        })
    },
    async maybeSpoolIteration({ iteration, ctx }: { iteration: Record<string, StepOutput>, ctx: SpoolContext }): Promise<Record<string, StepOutput> | DehydratedRef> {
        const result = await spoolService.maybeSpool({ value: iteration, ctx })
        if (!result.dehydrated) {
            return iteration
        }
        return result.value as DehydratedRef
    },
}

async function ensureRunDir(runId: string): Promise<void> {
    const dir = path.join(SPOOL_BASE_DIR, runId)
    const existing = inFlightDirCreates.get(dir)
    if (existing) {
        await existing
        return
    }
    const promise = fs.mkdir(dir, { recursive: true }).then(() => undefined)
    inFlightDirCreates.set(dir, promise)
    try {
        await promise
    }
    finally {
        inFlightDirCreates.delete(dir)
    }
}

async function readLocalIfExists(filePath: string): Promise<Buffer | undefined> {
    try {
        return await fs.readFile(filePath)
    }
    catch {
        return undefined
    }
}

async function uploadBlob({ ctx, fileId, data }: UploadBlobParams): Promise<void> {
    const url = `${ctx.apiUrl}v1/engine/files/blob/${fileId}?flowRunId=${encodeURIComponent(ctx.runId)}`
    const response = await fetch(url, {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${ctx.engineToken}`,
            'Content-Type': 'application/octet-stream',
        },
        body: data,
    })
    if (!response.ok) {
        throw new EngineGenericError(
            'SpoolUploadError',
            `Failed to upload spool blob ${fileId}: ${response.status} ${response.statusText}`,
        )
    }
}

async function downloadBlob({ ctx, fileId }: DownloadBlobParams): Promise<Buffer> {
    const response = await fetch(`${ctx.apiUrl}v1/engine/files/${fileId}`, {
        method: 'GET',
        headers: {
            Authorization: `Bearer ${ctx.engineToken}`,
        },
    })
    if (!response.ok) {
        throw new EngineGenericError(
            'SpoolDownloadError',
            `Failed to download spool blob ${fileId}: ${response.status} ${response.statusText}`,
        )
    }
    return Buffer.from(await response.arrayBuffer())
}

function blobLocalPath({ runId, fileId }: { runId: string, fileId: string }): string {
    return path.join(SPOOL_BASE_DIR, runId, `${fileId}.json`)
}

export type SpoolContext = {
    runId: string
    projectId: string
    engineToken: string
    apiUrl: string
}

type MaybeSpoolParams = {
    value: unknown
    ctx: SpoolContext
}

type MaybeSpoolResult = {
    value: unknown
    dehydrated: boolean
}

type HydrateParams = {
    ref: DehydratedRef
    ctx: SpoolContext
}

type UploadBlobParams = {
    ctx: SpoolContext
    fileId: string
    data: Buffer
}

type DownloadBlobParams = {
    ctx: SpoolContext
    fileId: string
}
