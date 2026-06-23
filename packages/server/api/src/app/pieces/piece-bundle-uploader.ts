import { isNil, tryCatch } from '@activepieces/core-utils'
import { safeHttp } from '@activepieces/server-utils'
import { FileType, PackageType, PieceType } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { fileService } from '../file/file.service'
import { s3Helper } from '../file/s3-helper'
import { system } from '../helper/system/system'
import { AppSystemProp } from '../helper/system/system-props'
import { pieceRepos } from './metadata/piece-metadata-service'

export const pieceBundleUploader = (log: FastifyBaseLogger) => ({
    async uploadMissingBundles(officialPieces: PieceToUpload[]): Promise<void> {
        const startTime = performance.now()
        const existingKeys = await s3Helper(log).listKeys(S3_PIECES_PREFIX)

        const bundles = await listSyncableBundles(officialPieces)
        const missing = bundles.filter(bundle => !existingKeys.has(bundle.key))
        log.info({ total: bundles.length, missing: missing.length }, 'Uploading missing piece bundles to S3')

        let uploaded = 0
        const batchSize = 20
        for (let done = 0; done < missing.length; done += batchSize) {
            const currentBatch = missing.slice(done, done + batchSize)
            const results = await Promise.all(currentBatch.map(bundle => uploadBundle(bundle, log)))
            uploaded += results.filter(Boolean).length
        }

        log.info({
            uploaded,
            skipped: bundles.length - missing.length,
            durationMs: Math.floor(performance.now() - startTime),
        }, 'Piece bundle S3 sync completed')
    },
})

async function listSyncableBundles(officialPieces: PieceToUpload[]): Promise<PieceBundle[]> {
    const officialBundles: PieceBundle[] = officialPieces.map(piece => ({
        name: piece.name,
        version: piece.version,
        key: pieceBundleS3Key(piece),
        source: { type: 'npm', name: piece.name, version: piece.version },
    }))

    const customPieces = await pieceRepos().find({
        where: { pieceType: PieceType.CUSTOM },
        select: { name: true, version: true, packageType: true, archiveId: true },
    })
    const customBundles: PieceBundle[] = customPieces.map(piece => ({
        name: piece.name,
        version: piece.version,
        key: pieceBundleS3Key(piece),
        source: piece.packageType === PackageType.ARCHIVE && !isNil(piece.archiveId)
            ? { type: 'archive', archiveId: piece.archiveId }
            : { type: 'npm', name: piece.name, version: piece.version },
    }))

    return [...officialBundles, ...customBundles]
}

async function uploadBundle(bundle: PieceBundle, log: FastifyBaseLogger): Promise<boolean> {
    const { error } = await tryCatch(async () => {
        const data = await fetchBundleData(bundle.source, log)
        await s3Helper(log).uploadFile(bundle.key, data, true)
    })
    if (error) {
        log.warn({ piece: { name: bundle.name, version: bundle.version }, error }, '[pieceBundleUploader#uploadBundle] Failed to upload piece bundle')
        return false
    }
    return true
}

async function fetchBundleData(source: BundleSource, log: FastifyBaseLogger): Promise<Buffer> {
    if (source.type === 'archive') {
        const { data } = await fileService(log).getDataOrThrow({
            fileId: source.archiveId,
            projectId: undefined,
            type: FileType.PACKAGE_ARCHIVE,
        })
        return data
    }
    const response = await safeHttp.retryingAxios.get<ArrayBuffer>(npmTarballUrl(source), {
        responseType: 'arraybuffer',
    })
    return Buffer.from(response.data)
}

export async function resolvePieceBundleUrl({ name, version, log }: { name: string, version: string, log: FastifyBaseLogger }): Promise<string> {
    if (!isNil(system.get(AppSystemProp.S3_BUCKET))) {
        const key = pieceBundleS3Key({ name, version })
        if (await s3Helper(log).objectExists(key)) {
            return s3Helper(log).getS3SignedUrl(key, `${name.replace('/', '-')}-${version}.tgz`)
        }
    }
    return npmTarballUrl({ name, version })
}

export function pieceBundleS3Key(piece: PieceToUpload): string {
    return `${S3_PIECES_PREFIX}${piece.name.replace('/', '-')}-${piece.version}.tgz`
}

function npmTarballUrl(piece: PieceToUpload): string {
    return `${NPM_REGISTRY_URL}/${piece.name}/-/${unscopedName(piece.name)}-${piece.version}.tgz`
}

function unscopedName(name: string): string {
    return name.startsWith('@') ? name.split('/')[1] : name
}

const NPM_REGISTRY_URL = 'https://registry.npmjs.org'
const S3_PIECES_PREFIX = 'pieces/'

type PieceToUpload = {
    name: string
    version: string
}

type BundleSource =
    | { type: 'npm', name: string, version: string }
    | { type: 'archive', archiveId: string }

type PieceBundle = {
    name: string
    version: string
    key: string
    source: BundleSource
}
