import {
    apId,
    FileCompression,
    FileType,
    JobPayload,
} from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { fileService } from '../file/file.service'
import { system } from '../helper/system/system'
import { AppSystemProp } from '../helper/system/system-props'

function getPayloadSizeInBytes(payload: unknown): number {
    return Buffer.byteLength(JSON.stringify(payload), 'utf8')
}

async function offloadPayload(
    log: FastifyBaseLogger,
    payload: unknown,
    projectId: string,
    platformId: string,
): Promise<JobPayload> {
    const fileId = apId()
    const data = Buffer.from(JSON.stringify(payload), 'utf8')
    await fileService(log).save({
        fileId,
        projectId,
        platformId,
        data,
        size: data.length,
        type: FileType.WEBHOOK_PAYLOAD,
        compression: FileCompression.NONE,
    })
    log.info({ fileId, size: data.length }, '[payloadOffloader] Payload offloaded to file storage')
    return { type: 'ref', fileId }
}

async function maybeOffloadPayload(
    log: FastifyBaseLogger,
    payload: unknown,
    projectId: string,
    platformId: string,
): Promise<JobPayload> {
    const thresholdKb = system.getNumberOrThrow(AppSystemProp.WEBHOOK_PAYLOAD_INLINE_THRESHOLD_KB)
    const thresholdBytes = thresholdKb * 1024
    const payloadSize = getPayloadSizeInBytes(payload)
    if (payloadSize <= thresholdBytes) {
        return { type: 'inline', value: payload }
    }
    const fileId = apId()
    const data = Buffer.from(JSON.stringify(payload), 'utf8')
    await fileService(log).save({
        fileId,
        projectId,
        platformId,
        data,
        size: data.length,
        type: FileType.WEBHOOK_PAYLOAD,
        compression: FileCompression.NONE,
    })
    log.info({ fileId, size: data.length }, '[payloadOffloader] Payload offloaded to file storage')
    return { type: 'ref', fileId }
}

export const payloadOffloader = {
    getPayloadSizeInBytes,
    maybeOffloadPayload,
    offloadPayload,
}
