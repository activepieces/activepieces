import { isNil, tryCatch } from '@activepieces/core-utils'
import { apDayjs, safeHttp } from '@activepieces/server-utils'
import { FileType, PackageType, PieceType } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { fileRepo } from '../file/file.service'
import { s3Helper } from '../file/s3-helper'
import { system } from '../helper/system/system'
import { AppSystemProp } from '../helper/system/system-props'
import { SystemJobName } from '../helper/system-jobs/common'
import { systemJobHandlers } from '../helper/system-jobs/job-handlers'
import { systemJobsSchedule } from '../helper/system-jobs/system-job'
import { pieceMetadataService } from './metadata/piece-metadata-service'

// Resolves a piece to a single downloadable link (see ADR 0002 — "Pieces are distributed as links").
// Official/registry pieces resolve to a signed-S3 object when cached, else to the npm tarball (and a
// lazy SYSTEM job caches it for next time). Custom (ARCHIVE) pieces are served straight from the file
// store. Always platform-scoped via the engine token's platformId.
export const pieceBundle = (log: FastifyBaseLogger) => ({
    async resolve({ name, version, archiveId, platformId, projectId }: ResolveParams): Promise<PieceBundleResolution> {
        // ARCHIVE pieces are addressed by archiveId — they may not be registered in metadata yet
        // (e.g. during EXTRACT_PIECE_METADATA of a freshly uploaded .tgz). Scope to the token's
        // platform so one platform cannot read another's private archive.
        if (!isNil(archiveId)) {
            const file = await fileRepo().findOneBy({ id: archiveId, platformId, type: FileType.PACKAGE_ARCHIVE })
            return isNil(file) ? { type: 'not-found' } : { type: 'stream', archiveId }
        }
        if (isNil(name) || isNil(version)) {
            return { type: 'not-found' }
        }
        const metadata = await pieceMetadataService(log).get({ name, version, platformId, projectId })
        if (isNil(metadata)) {
            return { type: 'not-found' }
        }
        if (metadata.packageType === PackageType.ARCHIVE && !isNil(metadata.archiveId)) {
            return { type: 'stream', archiveId: metadata.archiveId }
        }
        const s3Enabled = !isNil(system.get(AppSystemProp.S3_BUCKET))
        if (s3Enabled) {
            const s3 = s3Helper(log)
            const key = pieceBundleS3Key({ name, version })
            if (await s3.objectExists(key)) {
                const fileName = `${name.replace('/', '-')}-${version}.tgz`
                return { type: 'redirect', url: await s3.getS3SignedUrl(key, fileName) }
            }
            void tryCatch(() => enqueueBundleJob({ name, version, log }))
        }
        // CDN only mirrors official pieces — dev/custom/private registry pieces may 404 there, so fall back to npm.
        if (metadata.pieceType === PieceType.OFFICIAL && system.getBoolean(AppSystemProp.USE_CDN_FOR_BUNDLES)) {
            const cdnUrl = cdnTarballUrl({ name, version })
            if (await cdnBundleExists({ url: cdnUrl, log })) {
                return { type: 'redirect', url: cdnUrl }
            }
        }
        return { type: 'redirect', url: npmTarballUrl({ name, version }) }
    },
    registerJobHandler(): void {
        systemJobHandlers.registerJobHandler(SystemJobName.BUNDLE_PIECE, async (data) => {
            const s3 = s3Helper(log)
            const key = pieceBundleS3Key(data)
            if (await s3.objectExists(key)) {
                return
            }
            const response = await safeHttp.retryingAxios.get<ArrayBuffer>(npmTarballUrl(data), { responseType: 'arraybuffer' })
            await s3.uploadFile(key, Buffer.from(response.data))
            log.info({ piece: { name: data.name, version: data.version } }, '[pieceBundle] Cached piece tarball to S3')
        })
    },
})

async function enqueueBundleJob({ name, version, log }: EnqueueBundleJobParams): Promise<void> {
    await systemJobsSchedule(log).upsertJob({
        job: {
            name: SystemJobName.BUNDLE_PIECE,
            data: { name, version },
            jobId: `bundle-piece:${name}:${version}`,
        },
        schedule: { type: 'one-time', date: apDayjs() },
    })
}

function cdnTarballUrl({ name, version }: PieceRef): string {
    return `${CDN_PIECES_URL}${name.replace('/', '-')}-${version}.tgz`
}

// Piece tarballs are immutable per (name, version), so a positive result is cached forever.
async function cdnBundleExists({ url, log }: CdnBundleExistsParams): Promise<boolean> {
    if (cdnVerifiedUrls.has(url)) {
        return true
    }
    const { data: response, error } = await tryCatch(() =>
        safeHttp.axios.head(url, { validateStatus: (status) => status < 500 }),
    )
    if (error !== null) {
        log.warn({ error, url }, '[pieceBundle] CDN bundle HEAD check failed, falling back to npm')
        return false
    }
    const exists = response.status >= 200 && response.status < 300
    if (exists) {
        cdnVerifiedUrls.add(url)
    }
    return exists
}

function npmTarballUrl({ name, version }: PieceRef): string {
    const unscopedName = name.startsWith('@') ? name.split('/')[1] : name
    return `${NPM_REGISTRY_URL}/${name}/-/${unscopedName}-${version}.tgz`
}

function pieceBundleS3Key({ name, version }: PieceRef): string {
    return `${S3_PIECES_PREFIX}${name.replace('/', '-')}-${version}.tgz`
}

const cdnVerifiedUrls = new Set<string>()

const NPM_REGISTRY_URL = 'https://registry.npmjs.org'
const CDN_PIECES_URL = 'https://cdn.activepieces.com/pieces/retro/'
const S3_PIECES_PREFIX = 'pieces/'

type PieceRef = {
    name: string
    version: string
}

type EnqueueBundleJobParams = PieceRef & {
    log: FastifyBaseLogger
}

type CdnBundleExistsParams = {
    url: string
    log: FastifyBaseLogger
}

type ResolveParams = {
    name?: string
    version?: string
    archiveId?: string
    platformId: string
    projectId: string
}

type PieceBundleResolution =
    | { type: 'redirect', url: string }
    | { type: 'stream', archiveId: string }
    | { type: 'not-found' }
