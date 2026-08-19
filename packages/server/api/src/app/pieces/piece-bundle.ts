import { isNil, tryCatch } from '@activepieces/core-utils'
import { safeHttp } from '@activepieces/server-utils'
import { FileType, PackageType, PieceType } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { fileRepo } from '../file/file.service'
import { system } from '../helper/system/system'
import { AppSystemProp } from '../helper/system/system-props'
import { pieceMetadataService } from './metadata/piece-metadata-service'

// Resolves a piece to a single downloadable link (see ADR 0002 — "Pieces are distributed as links").
// Official/registry pieces resolve to the CDN tarball when available, else to the npm tarball. Custom
// (ARCHIVE) pieces are served straight from the file store. Always platform-scoped via the engine
// token's platformId.
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
        // CDN only mirrors official pieces — dev/custom/private registry pieces may 404 there, so fall back to npm.
        if (metadata.pieceType === PieceType.OFFICIAL && system.getBoolean(AppSystemProp.USE_CDN_FOR_BUNDLES)) {
            const cdnUrl = cdnTarballUrl({ name, version })
            if (await cdnBundleExists({ url: cdnUrl, log })) {
                return { type: 'redirect', url: cdnUrl }
            }
        }
        return { type: 'redirect', url: npmTarballUrl({ name, version }) }
    },
})

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
        return true
    }
    log.warn({ url, status: response.status }, '[pieceBundle] CDN bundle not served, falling back to npm')
    return false
}

function npmTarballUrl({ name, version }: PieceRef): string {
    const unscopedName = name.startsWith('@') ? name.split('/')[1] : name
    return `${NPM_REGISTRY_URL}/${name}/-/${unscopedName}-${version}.tgz`
}

const cdnVerifiedUrls = new Set<string>()

const NPM_REGISTRY_URL = 'https://registry.npmjs.org'
const CDN_PIECES_URL = 'https://cdn.activepieces.com/pieces/bundled/'

type PieceRef = {
    name: string
    version: string
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
